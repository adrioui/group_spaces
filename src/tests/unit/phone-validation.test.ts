import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

describe('Phone Number Validation and Normalization', () => {
  describe('isValidPhoneNumber', () => {
    it('should accept valid E.164 format numbers', () => {
      expect(isValidPhoneNumber('+14155550100')).toBe(true)
      expect(isValidPhoneNumber('+442071234567')).toBe(true)
      expect(isValidPhoneNumber('+33612345678')).toBe(true)
    })

    it('should accept valid numbers without + prefix', () => {
      expect(isValidPhoneNumber('14155550100')).toBe(true)
      expect(isValidPhoneNumber('442071234567')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(isValidPhoneNumber('123')).toBe(false)
      expect(isValidPhoneNumber('abc123')).toBe(false)
      expect(isValidPhoneNumber('')).toBe(false)
      expect(isValidPhoneNumber('555-1234')).toBe(false)
    })

    it('should handle international numbers', () => {
      expect(isValidPhoneNumber('+81312345678')).toBe(true) // Japan
      expect(isValidPhoneNumber('+61412345678')).toBe(true) // Australia
      expect(isValidPhoneNumber('+919876543210')).toBe(true) // India
    })
  })

  describe('parsePhoneNumber', () => {
    it('should parse and format to E.164', () => {
      const parsed = parsePhoneNumber('+14155550100')
      expect(parsed?.format('E.164')).toBe('+14155550100')
    })

    it('should preserve country code', () => {
      const parsed1 = parsePhoneNumber('+442071234567')
      expect(parsed1?.country).toBe('GB')
      expect(parsed1?.countryCallingCode).toBe('44')

      const parsed2 = parsePhoneNumber('+14155550100')
      expect(parsed2?.country).toBe('US')
      expect(parsed2?.countryCallingCode).toBe('1')
    })

    it('should normalize various input formats', () => {
      const parsed1 = parsePhoneNumber('+1 (415) 555-0100')
      expect(parsed1?.format('E.164')).toBe('+14155550100')

      const parsed2 = parsePhoneNumber('14155550100')
      expect(parsed2?.format('E.164')).toBe('+14155550100')
    })

    it('should format for display', () => {
      const parsed = parsePhoneNumber('+14155550100')
      expect(parsed?.formatInternational()).toBe('+1 415 555 0100')
    })

    it('should return undefined for invalid numbers', () => {
      expect(parsePhoneNumber('123')).toBeUndefined()
      expect(parsePhoneNumber('abc')).toBeUndefined()
    })
  })
})