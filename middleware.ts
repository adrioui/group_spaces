import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
 
export async function middleware(request: NextRequest) {
	const session = await auth.api.getSession({
		// Use the incoming request headers so cookies/bearer are correctly read in middleware
		headers: request.headers,
	})
 
	if(!session) {
		return NextResponse.redirect(new URL("/sign-in", request.url));
	}
 
	return NextResponse.next();
}
 
export const config = {
  runtime: "nodejs",
  matcher: ["/", "/spaces", "/spaces/*", "/notes/*", "/lessons/*", "/dashboard"], // Apply middleware to specific routes
};

