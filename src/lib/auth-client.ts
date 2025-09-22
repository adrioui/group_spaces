"use client"
import { createAuthClient } from "better-auth/react"
import { phoneNumberClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
   baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
   basePath: "/api/auth",
   plugins: [phoneNumberClient()],
});

// Export hooks for React components
export const {
   useSession,
   useSignIn,
   useSignOut,
   useSignUp,
} = authClient;

// Export OTP-specific hooks
export const {
   useSendOTP,
   useVerifyOTP,
} = authClient.phoneNumber;

// Type definitions
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.User;
