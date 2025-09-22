import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
	// Skip middleware for auth routes and public pages
	if (request.nextUrl.pathname.startsWith("/api/auth") ||
		request.nextUrl.pathname === "/sign-in" ||
		request.nextUrl.pathname === "/sign-up" ||
		request.nextUrl.pathname === "/") {
		return NextResponse.next();
	}

	const session = await auth.api.getSession({
		headers: request.headers,
	});

	// If no session, redirect to sign-in
	if (!session) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("callbackUrl", request.url);
		return NextResponse.redirect(signInUrl);
	}

	// Add user info to headers for server components
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-user-id", session.user.id); // Already a string in Better Auth
	// Better Auth with phoneNumber plugin doesn't guarantee email, set phone number instead if available
	if (session.user.phoneNumber) {
		requestHeaders.set("x-user-phone", session.user.phoneNumber);
	}
	if (session.user.name) {
		requestHeaders.set("x-user-name", session.user.name);
	}

	return NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|public/).*)",
	],
};

