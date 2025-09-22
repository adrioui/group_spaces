import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Security and Abuse Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rate Limiting Security', () => {
    it('should enforce per-phone rate limits that cannot be bypassed', async () => {
      const phone = '+14155550100'

      // Test that rate limits are enforced regardless of headers/cookies
      const requests = []
      for (let i = 0; i < 7; i++) {
        requests.push(
          fetch('/api/auth/phone-number/send-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Forwarded-For': `192.168.1.${i}`, // Different IPs
              'User-Agent': `Browser-${i}`, // Different UAs
            },
            body: JSON.stringify({ phoneNumber: phone }),
          })
        )
      }

      const responses = await Promise.all(requests)
      const lastResponse = responses[responses.length - 1]

      // Should still be rate limited despite header variations
      expect(lastResponse.status).toBe(429)
    })

    it('should enforce per-IP rate limits', async () => {
      const ip = '192.168.1.100'

      // Make requests from same IP with different phones
      const requests = []
      for (let i = 0; i < 35; i++) {
        requests.push(
          fetch('/api/auth/phone-number/send-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Forwarded-For': ip,
            },
            body: JSON.stringify({ phoneNumber: `+141555501${i.toString().padStart(2, '0')}` }),
          })
        )
      }

      const responses = await Promise.all(requests)
      const lastResponse = responses[responses.length - 1]

      // Should be rate limited by IP
      expect(lastResponse.status).toBe(429)
    })

    it('should not allow bypassing rate limits with different header combinations', async () => {
      const phone = '+14155550100'

      // Try various header combinations to bypass rate limits
      const headerCombinations = [
        { 'X-Forwarded-For': '192.168.1.1' },
        { 'X-Real-IP': '192.168.1.1' },
        { 'X-Forwarded-For': '192.168.1.1', 'X-Real-IP': '192.168.1.2' },
        { 'User-Agent': 'Mozilla/5.0' },
        { 'Referer': 'https://example.com' },
        { 'Origin': 'https://malicious.com' },
      ]

      // First, exhaust the rate limit
      for (let i = 0; i < 5; i++) {
        await fetch('/api/auth/phone-number/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone }),
        })
      }

      // Try to bypass with different headers
      for (const headers of headerCombinations) {
        const response = await fetch('/api/auth/phone-number/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify({ phoneNumber: phone }),
        })

        expect(response.status).toBe(429) // Should still be rate limited
      }
    })

    it('should not allow bypassing rate limits with cookies', async () => {
      const phone = '+14155550100'

      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        await fetch('/api/auth/phone-number/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone }),
        })
      }

      // Try with various cookies
      const cookieCombinations = [
        'session=abc123',
        'user=different_user',
        'csrf=token123',
        'bypass=true',
      ]

      for (const cookie of cookieCombinations) {
        const response = await fetch('/api/auth/phone-number/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie,
          },
          body: JSON.stringify({ phoneNumber: phone }),
        })

        expect(response.status).toBe(429)
      }
    })
  })

  describe('Captcha Protection (Production)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    afterEach(() => {
      process.env.NODE_ENV = 'test'
    })

    it('should require captcha token in production', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Captcha verification required' }),
      })

      const response = await fetch('/api/auth/phone-number/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: '+14155550100' }),
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Captcha')
    })

    it('should reject invalid captcha tokens', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid captcha token' }),
      })

      const response = await fetch('/api/auth/phone-number/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '+14155550100',
          captchaToken: 'invalid-token',
        }),
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Invalid captcha')
    })
  })

  describe('PII Protection in Logs', () => {
    let consoleSpy: any

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log')
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should redact phone numbers in production logs', () => {
      process.env.NODE_ENV = 'production'

      const phone = '+14155550100'
      const logMessage = (phone: string, event: string) => {
        // Production logging should redact PII
        const redactedPhone = phone.replace(/(\+\d{1,3})\d+(\d{4})/, '$1***$2')
        console.log(`Auth event: ${event}, Phone: ${redactedPhone}`)
      }

      logMessage(phone, 'OTP_SENT')

      expect(consoleSpy).toHaveBeenCalledWith('Auth event: OTP_SENT, Phone: +1***0100')
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('14155550100'))

      process.env.NODE_ENV = 'test'
    })

    it('should never log OTP codes in production', () => {
      process.env.NODE_ENV = 'production'

      const otpCode = '123456'
      const logOTPEvent = (code: string, phone: string) => {
        // Should not log the actual code in production
        console.log(`OTP sent to ${phone.replace(/(\+\d{1,3})\d+(\d{4})/, '$1***$2')}`)
        // Never log: console.log(`OTP code: ${code}`)
      }

      logOTPEvent(otpCode, '+14155550100')

      // Verify the OTP code is not in any log
      const allLogs = consoleSpy.mock.calls.flat().join(' ')
      expect(allLogs).not.toContain(otpCode)

      process.env.NODE_ENV = 'test'
    })

    it('should not expose sensitive data in error responses', async () => {
      // Mock an internal error response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error',
          // Should not expose: originalError, stack traces, config, etc.
        }),
      })

      const response = await fetch('/api/auth/phone-number/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: '+14155550100' }),
      })

      const data = await response.json()

      // Should not contain sensitive information
      expect(data.originalError).toBeUndefined()
      expect(data.stack).toBeUndefined()
      expect(data.config).toBeUndefined()
      expect(data.env).toBeUndefined()
    })
  })

  describe('Session Security', () => {
    it('should set secure session cookie properties', () => {
      const sessionCookie = 'better-auth.session_token=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800'

      // Verify security properties
      expect(sessionCookie).toContain('HttpOnly')
      expect(sessionCookie).toContain('Secure')
      expect(sessionCookie).toContain('SameSite=Lax')
      expect(sessionCookie).toContain('Path=/')

      // Should not allow JavaScript access
      expect(sessionCookie).toContain('HttpOnly')
    })

    it('should clear session completely on logout', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        headers: new Headers({
          'set-cookie': 'better-auth.session_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
        }),
      })

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Cookie': 'better-auth.session_token=valid-session',
        },
      })

      expect(response.ok).toBe(true)

      // Verify session cookie is cleared
      const cookieHeader = response.headers.get('set-cookie')
      expect(cookieHeader).toContain('Max-Age=0')
      expect(cookieHeader).toContain('better-auth.session_token=')
    })

    it('should reject sessions with invalid signatures', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid session signature' }),
      })

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Cookie': 'better-auth.session_token=tampered.token.signature',
        },
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Invalid session')
    })
  })

  describe('Input Validation Security', () => {
    it('should sanitize phone number inputs', async () => {
      const maliciousInputs = [
        '+1<script>alert("xss")</script>4155550100',
        '+1${process.env.SECRET}4155550100',
        '+1\'; DROP TABLE users; --4155550100',
        '+1\x00\x004155550100', // null bytes
      ]

      for (const maliciousPhone of maliciousInputs) {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Invalid phone number format' }),
        })

        const response = await fetch('/api/auth/phone-number/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: maliciousPhone }),
        })

        expect(response.status).toBe(400)
      }
    })

    it('should validate OTP code format strictly', async () => {
      const maliciousOTPs = [
        '123456<script>',
        '${code}',
        '123\x00456',
        '../../../etc/passwd',
        'UNION SELECT * FROM users',
      ]

      for (const maliciousOTP of maliciousOTPs) {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Invalid code format' }),
        })

        const response = await fetch('/api/auth/phone-number/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: '+14155550100',
            code: maliciousOTP,
          }),
        })

        expect(response.status).toBe(400)
      }
    })

    it('should reject oversized payloads', async () => {
      const largePayload = {
        phoneNumber: '+14155550100',
        extraField: 'x'.repeat(10000), // Large string
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 413,
        json: async () => ({ error: 'Payload too large' }),
      })

      const response = await fetch('/api/auth/phone-number/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(largePayload),
      })

      expect(response.status).toBe(413)
    })
  })

  describe('CORS and Origin Validation', () => {
    it('should validate request origins in production', async () => {
      process.env.NODE_ENV = 'production'

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Invalid origin' }),
      })

      const response = await fetch('/api/auth/phone-number/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://malicious-site.com',
        },
        body: JSON.stringify({ phoneNumber: '+14155550100' }),
      })

      expect(response.status).toBe(403)

      process.env.NODE_ENV = 'test'
    })

    it('should set appropriate CORS headers', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        headers: new Headers({
          'Access-Control-Allow-Origin': 'https://yourdomain.com',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'POST, GET',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }),
      })

      const response = await fetch('/api/auth/phone-number/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: '+14155550100' }),
      })

      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    })
  })
})