import { describe, it, expect, beforeEach } from 'vitest'

// Mock rate limiter implementation for testing
class RateLimiter {
  private attempts = new Map<string, { count: number; resetAt: number; lastSentAt?: number }>()

  checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
    cooldownMs?: number
  ): { allowed: boolean; error?: string } {
    const now = Date.now()
    const entry = this.attempts.get(key)

    if (entry) {
      // Check cooldown
      if (cooldownMs && entry.lastSentAt && now - entry.lastSentAt < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - (now - entry.lastSentAt)) / 1000)
        return {
          allowed: false,
          error: `Please wait ${remainingSeconds} seconds before requesting a new code`,
        }
      }

      // Check rate limit
      if (now < entry.resetAt) {
        if (entry.count >= limit) {
          return {
            allowed: false,
            error: `Too many requests. Please try again later`,
          }
        }
        entry.count++
        entry.lastSentAt = now
      } else {
        // Reset window
        this.attempts.set(key, { count: 1, resetAt: now + windowMs, lastSentAt: now })
      }
    } else {
      this.attempts.set(key, { count: 1, resetAt: now + windowMs, lastSentAt: now })
    }

    return { allowed: true }
  }

  reset() {
    this.attempts.clear()
  }
}

describe('Rate Limiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    rateLimiter = new RateLimiter()
  })

  describe('Basic rate limiting', () => {
    it('should allow requests within limit', () => {
      const result1 = rateLimiter.checkRateLimit('phone:+14155550100', 5, 60000)
      expect(result1.allowed).toBe(true)

      const result2 = rateLimiter.checkRateLimit('phone:+14155550100', 5, 60000)
      expect(result2.allowed).toBe(true)
    })

    it('should block requests exceeding limit', () => {
      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.checkRateLimit('phone:+14155550100', 5, 60000)
        expect(result.allowed).toBe(true)
      }

      // 6th request should be blocked
      const result = rateLimiter.checkRateLimit('phone:+14155550100', 5, 60000)
      expect(result.allowed).toBe(false)
      expect(result.error).toBe('Too many requests. Please try again later')
    })

    it('should track different keys separately', () => {
      // Phone 1
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.checkRateLimit('phone:+14155550100', 5, 60000)
        expect(result.allowed).toBe(true)
      }

      // Phone 2 should still be allowed
      const result = rateLimiter.checkRateLimit('phone:+14155550101', 5, 60000)
      expect(result.allowed).toBe(true)
    })
  })

  describe('Cooldown period', () => {
    it('should enforce cooldown between requests', () => {
      // First request
      const result1 = rateLimiter.checkRateLimit('phone:+14155550100', 5, 60000, 60000)
      expect(result1.allowed).toBe(true)

      // Immediate second request should be blocked
      const result2 = rateLimiter.checkRateLimit('phone:+14155550100', 5, 60000, 60000)
      expect(result2.allowed).toBe(false)
      expect(result2.error).toContain('Please wait')
      expect(result2.error).toContain('seconds')
    })
  })

  describe('IP-based rate limiting', () => {
    it('should limit by IP address', () => {
      // Make 30 requests (the IP limit)
      for (let i = 0; i < 30; i++) {
        const result = rateLimiter.checkRateLimit('ip:192.168.1.1', 30, 60000)
        expect(result.allowed).toBe(true)
      }

      // 31st request should be blocked
      const result = rateLimiter.checkRateLimit('ip:192.168.1.1', 30, 60000)
      expect(result.allowed).toBe(false)
    })
  })

  describe('Window reset', () => {
    it('should reset count after window expires', () => {
      // Use a very short window for testing
      const windowMs = 100

      // Make requests up to limit
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.checkRateLimit('phone:+14155550100', 5, windowMs)
        expect(result.allowed).toBe(true)
      }

      // Should be blocked
      let result = rateLimiter.checkRateLimit('phone:+14155550100', 5, windowMs)
      expect(result.allowed).toBe(false)

      // Wait for window to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          // Should be allowed again
          result = rateLimiter.checkRateLimit('phone:+14155550100', 5, windowMs)
          expect(result.allowed).toBe(true)
          resolve(undefined)
        }, windowMs + 10)
      })
    })
  })
})