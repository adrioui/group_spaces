"use client"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
   baseURL: "http://localhost:3000/api/auth",
});

type SessionData = ReturnType<typeof authClient.useSession>

export function useSession(): SessionData {
   return authClient.useSession();
}
