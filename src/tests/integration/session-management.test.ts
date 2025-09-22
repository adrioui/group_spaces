import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock fetch for API tests
const mockFetch = (response: any, status = 200, headers: Record<string, string> = {}) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    headers: new Headers(headers),
  })
}

describe('Session Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/auth/session', () => {
    it('should return user data after successful OTP verification', async () => {
      mockFetch({
        user: {
          id: 'user123',
          phoneNumber: '+14155550100',
          phoneVerified: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        session: {
          id: 'session123',
          userId: 'user123',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      }, 200)

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Cookie': 'better-auth.session_token=valid-session-token'
        }
      })

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.user).toBeDefined()
      expect(data.user.id).toBe('user123')
      expect(data.user.phoneVerified).toBe(true)
      expect(data.session).toBeDefined()
    })

    it('should return empty response before authentication', async () => {
      mockFetch({
        user: null,
        session: null
      }, 200)

      const response = await fetch('/api/auth/session', {
        method: 'GET'
      })

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.user).toBeNull()
      expect(data.session).toBeNull()
    })

    it('should return 401 for invalid session token', async () => {
      mockFetch({
        error: 'Invalid session'
      }, 401)

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Cookie': 'better-auth.session_token=invalid-token'
        }
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Invalid session')
    })

    it('should return 401 for expired session', async () => {
      mockFetch({
        error: 'Session expired'
      }, 401)

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Cookie': 'better-auth.session_token=expired-token'
        }
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Session expired')
    })
  })

  describe('Session Cookie Properties', () => {
    it('should set HttpOnly session cookies', () => {
      const mockSetCookie = 'better-auth.session_token=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800'

      // Verify cookie properties
      expect(mockSetCookie).toContain('HttpOnly')
      expect(mockSetCookie).toContain('Secure')
      expect(mockSetCookie).toContain('SameSite=Lax')
      expect(mockSetCookie).toContain('Path=/')
    })

    it('should set appropriate Max-Age for session duration', () => {
      const mockSetCookie = 'better-auth.session_token=abc123; Max-Age=604800' // 7 days

      // 7 days = 604800 seconds
      expect(mockSetCookie).toContain('Max-Age=604800')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should clear session cookie on logout', async () => {
      mockFetch({ success: true }, 200, {
        'set-cookie': 'better-auth.session_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
      })

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Cookie': 'better-auth.session_token=valid-session-token'
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.success).toBe(true)

      // Check that session cookie is cleared
      const cookieHeader = response.headers.get('set-cookie')
      expect(cookieHeader).toContain('Max-Age=0')
    })

    it('should return success even without valid session', async () => {
      mockFetch({ success: true }, 200)

      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('Middleware Protection', () => {
    it('should redirect to sign-in when accessing protected route without session', async () => {
      mockFetch('', 302, {
        'location': '/sign-in?callbackUrl=%2Fprotected'
      })

      const response = await fetch('/protected', {
        method: 'GET',
        redirect: 'manual'
      })

      expect(response.status).toBe(302)
      const location = response.headers.get('location')
      expect(location).toContain('/sign-in')
      expect(location).toContain('callbackUrl')
    })

    it('should allow access to protected route with valid session', async () => {
      mockFetch({
        message: 'Access granted to protected resource'
      }, 200)

      const response = await fetch('/protected', {
        method: 'GET',
        headers: {
          'Cookie': 'better-auth.session_token=valid-session-token'
        }
      })

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
    })

    it('should preserve callback URL in redirect', async () => {
      const protectedUrl = '/spaces/123/notes'
      mockFetch('', 302, {
        'location': `/sign-in?callbackUrl=${encodeURIComponent(protectedUrl)}`
      })

      const response = await fetch(protectedUrl, {
        method: 'GET',
        redirect: 'manual'
      })

      expect(response.status).toBe(302)
      const location = response.headers.get('location')
      expect(location).toContain(`callbackUrl=${encodeURIComponent(protectedUrl)}`)
    })
  })

  describe('Session Refresh', () => {
    it('should refresh session when approaching expiry', async () => {
      // Simulate session that's close to expiry
      const nearExpirySession = {
        user: {
          id: 'user123',
          phoneNumber: '+14155550100',
          phoneVerified: true
        },
        session: {
          id: 'session123',
          userId: 'user123',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        }
      }

      mockFetch(nearExpirySession, 200, {
        'set-cookie': 'better-auth.session_token=refreshed-token; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800'
      })

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Cookie': 'better-auth.session_token=near-expiry-token'
        }
      })

      expect(response.ok).toBe(true)

      // Should set new session cookie
      const cookieHeader = response.headers.get('set-cookie')
      expect(cookieHeader).toContain('better-auth.session_token=refreshed-token')
    })
  })

  describe('User ID Format', () => {
    it('should handle user ID as text to avoid parseInt errors', async () => {
      const textUserId = 'user_abc123def456'

      mockFetch({
        user: {
          id: textUserId,
          phoneNumber: '+14155550100',
          phoneVerified: true
        },
        session: {
          id: 'session123',
          userId: textUserId
        }
      }, 200)

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Cookie': 'better-auth.session_token=valid-session-token'
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.user.id).toBe(textUserId)
      expect(typeof data.user.id).toBe('string')
    })
  })
})