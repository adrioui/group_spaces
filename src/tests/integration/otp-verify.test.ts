import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock fetch for API tests
const mockFetch = (response: any, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    headers: new Headers({
      'set-cookie': status === 200 ? 'better-auth.session_token=test-session-token; HttpOnly; Secure; SameSite=Lax' : ''
    }),
  })
}

describe('OTP Verify Endpoint Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/phone-number/verify-otp', () => {
    it('should return 200 and set session cookie for valid code', async () => {
      mockFetch({
        success: true,
        user: {
          id: 'user123',
          phoneNumber: '+14155550100',
          phoneVerified: true
        }
      }, 200)

      const response = await fetch('/api/auth/phone-number/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '+14155550100',
          code: '123456'
        }),
      })

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.user.phoneVerified).toBe(true)

      // Check that session cookie is set
      const cookieHeader = response.headers.get('set-cookie')
      expect(cookieHeader).toContain('better-auth.session_token')
      expect(cookieHeader).toContain('HttpOnly')
      expect(cookieHeader).toContain('Secure')
    })

    it('should create user on first login and set phoneVerified=true', async () => {
      mockFetch({
        success: true,
        user: {
          id: 'user123',
          phoneNumber: '+14155550100',
          phoneVerified: true,
          createdAt: new Date().toISOString()
        },
        isNewUser: true
      }, 200)

      const response = await fetch('/api/auth/phone-number/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '+14155550100',
          code: '123456'
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.user.phoneVerified).toBe(true)
      expect(data.isNewUser).toBe(true)
    })

    it('should return 400 for wrong code', async () => {
      mockFetch({
        error: 'Invalid verification code',
        code: 'INVALID_CODE'
      }, 400)

      const response = await fetch('/api/auth/phone-number/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '+14155550100',
          code: '999999'
        }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Invalid verification code')
      expect(data.code).toBe('INVALID_CODE')
    })

    it('should return 400 for expired code', async () => {
      mockFetch({
        error: 'Verification code has expired',
        code: 'EXPIRED_CODE'
      }, 400)

      const response = await fetch('/api/auth/phone-number/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '+14155550100',
          code: '123456'
        }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Verification code has expired')
      expect(data.code).toBe('EXPIRED_CODE')
    })

    it('should return 429 on repeated verification failures', async () => {
      // First few attempts return invalid code
      for (let i = 0; i < 5; i++) {
        mockFetch({
          error: 'Invalid verification code',
          code: 'INVALID_CODE'
        }, 400)

        await fetch('/api/auth/phone-number/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: '+14155550100',
            code: '999999'
          }),
        })
      }

      // Next attempt should be rate limited
      mockFetch({
        error: 'Too many failed attempts. Please request a new code',
        code: 'TOO_MANY_ATTEMPTS'
      }, 429)

      const response = await fetch('/api/auth/phone-number/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '+14155550100',
          code: '123456'
        }),
      })

      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.error).toContain('Too many failed attempts')
    })

    it('should handle missing phone number', async () => {
      mockFetch({
        error: 'Phone number is required',
        code: 'MISSING_PHONE'
      }, 400)

      const response = await fetch('/api/auth/phone-number/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: '123456'
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Phone number')
    })

    it('should handle missing code', async () => {
      mockFetch({
        error: 'Verification code is required',
        code: 'MISSING_CODE'
      }, 400)

      const response = await fetch('/api/auth/phone-number/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '+14155550100'
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('code')
    })

    it('should normalize phone number before verification', async () => {
      const variations = [
        '+1 (415) 555-0100',
        '14155550100',
        '(415) 555-0100'
      ]

      for (const phone of variations) {
        mockFetch({
          success: true,
          user: {
            id: 'user123',
            phoneNumber: '+14155550100', // Should always be normalized to E.164
            phoneVerified: true
          }
        }, 200)

        const response = await fetch('/api/auth/phone-number/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phone,
            code: '123456'
          }),
        })

        expect(response.ok).toBe(true)
        const data = await response.json()
        expect(data.user.phoneNumber).toBe('+14155550100')
      }
    })

    it('should handle code format validation', async () => {
      const invalidCodes = [
        '12345', // too short
        '1234567', // too long
        'abc123', // non-numeric
        '', // empty
        '123 456' // with spaces
      ]

      for (const code of invalidCodes) {
        mockFetch({
          error: 'Invalid code format',
          code: 'INVALID_FORMAT'
        }, 400)

        const response = await fetch('/api/auth/phone-number/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: '+14155550100',
            code
          }),
        })

        expect(response.status).toBe(400)
      }
    })
  })
})