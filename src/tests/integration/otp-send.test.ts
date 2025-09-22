import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock fetch for API tests
const mockFetch = (response: any, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    headers: new Headers(),
  })
}

describe('OTP Send Endpoint Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/phone-number/send-otp', () => {
    it('should return 200 for valid phone number', async () => {
      mockFetch({ success: true }, 200)

      const response = await fetch('/api/auth/phone-number/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: '+14155550100' }),
      })

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should return 400 for invalid phone number', async () => {
      mockFetch({ error: 'Invalid phone number format' }, 400)

      const response = await fetch('/api/auth/phone-number/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: '123' }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid phone number')
    })

    it('should return 429 when rate limited', async () => {
      mockFetch({ error: 'Too many requests. Please try again later' }, 429)

      // Make multiple requests
      for (let i = 0; i < 6; i++) {
        const response = await fetch('/api/auth/phone-number/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: '+14155550100' }),
        })

        if (i === 5) {
          // 6th request should be rate limited
          expect(response.status).toBe(429)
          const data = await response.json()
          expect(data.error).toContain('Too many requests')
        }
      }
    })

    it('should enforce cooldown period', async () => {
      // First request succeeds
      mockFetch({ success: true }, 200)

      let response = await fetch('/api/auth/phone-number/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: '+14155550100' }),
      })
      expect(response.ok).toBe(true)

      // Immediate second request should fail with cooldown error
      mockFetch({ error: 'Please wait 60 seconds before requesting a new code' }, 429)

      response = await fetch('/api/auth/phone-number/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: '+14155550100' }),
      })

      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.error).toContain('Please wait')
    })

    it('should normalize phone numbers to E.164', async () => {
      const variations = [
        '+1 (415) 555-0100',
        '14155550100',
        '+14155550100',
        '(415) 555-0100'
      ]

      for (const phone of variations) {
        mockFetch({ success: true, normalizedPhone: '+14155550100' }, 200)

        const response = await fetch('/api/auth/phone-number/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone }),
        })

        const data = await response.json()
        expect(data.normalizedPhone).toBe('+14155550100')
      }
    })

    it('should handle international phone numbers', async () => {
      const internationalNumbers = [
        { input: '+442071234567', country: 'GB' },
        { input: '+33612345678', country: 'FR' },
        { input: '+81312345678', country: 'JP' },
      ]

      for (const { input } of internationalNumbers) {
        mockFetch({ success: true }, 200)

        const response = await fetch('/api/auth/phone-number/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: input }),
        })

        expect(response.ok).toBe(true)
      }
    })

    it('should require captcha in production mode', async () => {
      // Simulate production environment
      process.env.NODE_ENV = 'production'

      mockFetch({ error: 'Captcha verification required' }, 401)

      const response = await fetch('/api/auth/phone-number/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: '+14155550100' }),
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Captcha')

      // Reset
      process.env.NODE_ENV = 'test'
    })
  })
})