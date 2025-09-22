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

