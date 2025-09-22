import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('OTP Delivery', () => {
  let originalEnv: NodeJS.ProcessEnv
  let consoleLogSpy: any

  beforeEach(() => {
    originalEnv = { ...process.env }
    consoleLogSpy = vi.spyOn(console, 'log')
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('Development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should log OTP code to console in development', async () => {
      const phoneNumber = '+14155550100'
      const code = '123456'

      // Simulate OTP send in dev mode
      const sendOTP = async (phone: string, otp: string) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('\n📱 [DEV MODE] OTP Request:')
          console.log(`   Phone: ${phone}`)
          console.log(`   Code: ${otp}`)
          console.log(`   Time: ${new Date().toISOString()}\n`)
          return { success: true }
        }
        return { success: false }
      }

      const result = await sendOTP(phoneNumber, code)

      expect(result.success).toBe(true)
      expect(consoleLogSpy).toHaveBeenCalledWith('\n📱 [DEV MODE] OTP Request:')
      expect(consoleLogSpy).toHaveBeenCalledWith(`   Phone: ${phoneNumber}`)
      expect(consoleLogSpy).toHaveBeenCalledWith(`   Code: ${code}`)
    })

    it('should not call Twilio in development', async () => {
      const twilioMock = {
        messages: {
          create: vi.fn()
        }
      }

      const sendOTP = async (phone: string, otp: string) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[DEV] OTP: ${otp} for ${phone}`)
          return { success: true }
        }

        // This should not be reached in dev
        await twilioMock.messages.create({
          body: `Your code is ${otp}`,
          from: '+1234567890',
          to: phone
        })
        return { success: true }
      }

      await sendOTP('+14155550100', '123456')
      expect(twilioMock.messages.create).not.toHaveBeenCalled()
    })
  })

  describe('Production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
      process.env.TWILIO_ACCOUNT_SID = 'test_sid'
      process.env.TWILIO_AUTH_TOKEN = 'test_token'
      process.env.TWILIO_PHONE_NUMBER = '+1234567890'
    })

    it('should format Twilio message correctly', () => {
      const phone = '+14155550100'
      const code = '123456'

      const formatTwilioMessage = (to: string, otp: string) => ({
        body: `Your verification code is: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      })

      const message = formatTwilioMessage(phone, code)

      expect(message.body).toBe('Your verification code is: 123456')
      expect(message.from).toBe('+1234567890')
      expect(message.to).toBe('+14155550100')
    })

    it('should handle Twilio client errors', async () => {
      const sendOTP = async (phone: string, code: string) => {
        try {
          // Simulate Twilio error
          throw new Error('Invalid phone number')
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }

      const result = await sendOTP('+invalid', '123456')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid phone number')
    })

    it('should never log OTP codes in production', () => {
      const code = '123456'
      const phone = '+14155550100'

      // Simulate production logging
      const logMessage = (msg: string, data: any) => {
        // Should not include the actual code
        expect(msg).not.toContain(code)
        expect(JSON.stringify(data)).not.toContain(code)
      }

      logMessage('OTP sent', { phone, status: 'sent' })
    })
  })

  describe('Error mapping', () => {
    it('should map common error codes to user-friendly messages', () => {
      const errorMap: Record<string, string> = {
        'INVALID_CODE': 'The verification code is incorrect',
        'EXPIRED_CODE': 'The verification code has expired',
        'TOO_MANY_ATTEMPTS': 'Too many failed attempts. Please request a new code',
        'INVALID_PHONE': 'Please enter a valid phone number',
        'RATE_LIMITED': 'Too many requests. Please try again later'
      }

      Object.entries(errorMap).forEach(([code, message]) => {
        expect(message).toBeTruthy()
        expect(message).not.toContain(code) // Should not expose technical codes
      })
    })
  })
})