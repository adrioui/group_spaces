# Edge Middleware Auth — Edge-Safe Refactor Guide

Purpose
- Make authentication checks in `middleware.ts` Edge-compatible by removing transitive imports of server-only modules (like `@/db`).
- Preserve redirect behavior while avoiding DB access in the Edge runtime.

Current Issue
- `middleware.ts` imports `@/lib/auth`, which imports `@/db` (and thus Node-only DB drivers).
- Edge middleware runs on the Edge runtime where Node APIs and DB clients are not supported.
- This can cause build bundling errors or runtime failures.

Approach Options
- Option A (recommended): Call a Node runtime API route from middleware to validate session using request cookies/headers. The API route may use `@/lib/auth` and `@/db` safely (Node runtime), and respond with a simple JSON boolean/object.
- Option B: Use a lightweight token/cookie verification that does not require DB I/O, if your auth library supports an Edge-compatible verification strategy.

Implementation (Option A)

1) Add a dedicated session probe API route
- File: `src/app/api/auth/session/route.ts`
- Responsibility: Use Better Auth on the server (Node runtime) to validate the current session based on headers/cookies and return minimal info.

Template
```ts
// src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ ok: false }, { status: 200 })
    }
    return NextResponse.json({ ok: true, user: { id: session.user.id, name: session.user.name ?? null } }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'session-check-failed' }, { status: 200 })
  }
}
```

2) Refactor `middleware.ts` to fetch the session probe
- Replace the direct import of `@/lib/auth` with a fetch call to the session probe route.

Template
```ts
// middleware.ts (Edge runtime)
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip for auth routes and public pages
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname === '/sign-in' ||
    request.nextUrl.pathname === '/sign-up'
  ) {
    return NextResponse.next()
  }

  // Call Node runtime API to validate session
  const url = new URL('/api/auth/session', request.url)
  const resp = await fetch(url, {
    headers: {
      cookie: request.headers.get('cookie') || '',
      'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
      'x-real-ip': request.headers.get('x-real-ip') || '',
    },
    cache: 'no-store',
    redirect: 'manual',
  })

  let ok = false
  try {
    const data = await resp.json()
    ok = !!data?.ok
  } catch {
    ok = false
  }

  if (!ok) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public/).*)'],
}
```

3) Remove the transitive DB import from middleware
- Ensure `middleware.ts` no longer imports `@/lib/auth` or `@/db` directly.
- Confirm the API route runs on the Node runtime (default for route handlers) and can use `@/lib/auth` and `@/db`.

Verification Checklist
- `npm run lint` → no unused import warnings in `middleware.ts`.
- `npm run build` → no Edge bundling errors.
- Navigate to a protected route while signed out → redirected to `/sign-in`.
- Sign in (or mock session in dev) → protected routes load without redirect.

Notes
- Keep the API response minimal (avoid leaking user PII). Only return what middleware needs (e.g., `{ ok: true }`).
- If you later adopt PGlite in E2E, this middleware remains unchanged; the API route adapts via env to whichever DB client is active.

