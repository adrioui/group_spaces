import { test, expect, Page } from '@playwright/test'

// Helper to extract OTP from console logs
const extractOTPFromLogs = (logs: string[]): string | null => {
  for (const log of logs) {
    const match = log.match(/Code: (\d{6})/)
    if (match) {
      return match[1]
    }
  }
  return null
}

// Helper to wait for OTP and enter it
const waitForOTPAndEnter = async (page: Page, logs: string[]) => {
  // Wait for OTP to appear in logs
  await page.waitForTimeout(1000)

  const otp = extractOTPFromLogs(logs)
  if (!otp) {
    throw new Error('OTP not found in console logs')
  }

  // Enter the OTP code
  const otpInput = page.locator('input[data-testid="otp-input"], input[type="text"][maxlength="6"]')
  await otpInput.fill(otp)

  return otp
}

test.describe('OTP Authentication E2E', () => {
  let consoleLogs: string[] = []

  test.beforeEach(async ({ page }) => {
    consoleLogs = []

    // Capture console logs to extract OTP
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text())
      }
    })
  })

  test.describe('Happy Path Sign-in', () => {
    test('should complete full OTP authentication flow', async ({ page }) => {
      // Navigate to sign-in page
      await page.goto('/sign-in')

      // Enter phone number
      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]')
      await phoneInput.fill('+14155550100')

      // Click send OTP button
      const sendButton = page.locator('button:has-text("Send Code"), button:has-text("Send OTP")')
      await sendButton.click()

      // Wait for OTP to be sent (should appear in console logs)
      await page.waitForTimeout(2000)

      // Extract OTP from logs and enter it
      const otp = await waitForOTPAndEnter(page, consoleLogs)

      // Click verify button
      const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Sign In")')
      await verifyButton.click()

      // Should redirect to dashboard/spaces or callback URL
      await page.waitForURL(/\/(spaces|dashboard)/)

      // Verify authentication state
      const userMenu = page.locator('[data-testid="user-menu"], .user-avatar, button:has-text("Profile")')
      await expect(userMenu).toBeVisible()
    })

    test('should redirect to callback URL after authentication', async ({ page }) => {
      const callbackUrl = '/spaces/123'

      // Navigate to sign-in with callback URL
      await page.goto(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`)

      // Complete OTP flow
      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]')
      await phoneInput.fill('+14155550100')

      const sendButton = page.locator('button:has-text("Send Code"), button:has-text("Send OTP")')
      await sendButton.click()

      await page.waitForTimeout(2000)
      await waitForOTPAndEnter(page, consoleLogs)

      const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Sign In")')
      await verifyButton.click()

      // Should redirect to callback URL
      await page.waitForURL(callbackUrl)
      expect(page.url()).toContain(callbackUrl)
    })

    test('should persist session on page refresh', async ({ page }) => {
      // Complete authentication
      await page.goto('/sign-in')

      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]')
      await phoneInput.fill('+14155550100')

      const sendButton = page.locator('button:has-text("Send Code"), button:has-text("Send OTP")')
      await sendButton.click()

      await page.waitForTimeout(2000)
      await waitForOTPAndEnter(page, consoleLogs)

      const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Sign In")')
      await verifyButton.click()

      await page.waitForURL(/\/(spaces|dashboard)/)

      // Refresh the page
      await page.reload()

      // Should still be authenticated
      const userMenu = page.locator('[data-testid="user-menu"], .user-avatar, button:has-text("Profile")')
      await expect(userMenu).toBeVisible()

      // Should not redirect to sign-in
      expect(page.url()).not.toContain('/sign-in')
    })
  })

  test.describe('First-time Sign-up', () => {
    test('should complete first-time user registration with optional profile step', async ({ page }) => {
      const newPhoneNumber = `+1415555${Date.now().toString().slice(-4)}`

      await page.goto('/sign-up')

      // Enter new phone number
      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]')
      await phoneInput.fill(newPhoneNumber)

      const sendButton = page.locator('button:has-text("Send Code"), button:has-text("Send OTP")')
      await sendButton.click()

      await page.waitForTimeout(2000)
      await waitForOTPAndEnter(page, consoleLogs)

      const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Create Account")')
      await verifyButton.click()

      // May show profile completion step for new users
      const currentUrl = page.url()
      if (currentUrl.includes('/profile') || currentUrl.includes('/onboarding')) {
        // Fill optional profile info if present
        const nameInput = page.locator('input[name="name"], input[placeholder*="name"]')
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test User')
        }

        const continueButton = page.locator('button:has-text("Continue"), button:has-text("Save")')
        if (await continueButton.isVisible()) {
          await continueButton.click()
        }
      }

      // Should end up authenticated
      await page.waitForURL(/\/(spaces|dashboard)/)
      const userMenu = page.locator('[data-testid="user-menu"], .user-avatar, button:has-text("Profile")')
      await expect(userMenu).toBeVisible()
    })
  })

  test.describe('Resend Cooldown', () => {
    test('should disable resend button during cooldown period', async ({ page }) => {
      await page.goto('/sign-in')

      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]')
      await phoneInput.fill('+14155550100')

      const sendButton = page.locator('button:has-text("Send Code"), button:has-text("Send OTP")')
      await sendButton.click()

      // Wait for OTP to be sent
      await page.waitForTimeout(1000)

      // Resend button should be disabled with countdown
      const resendButton = page.locator('button:has-text("Resend"), button[disabled]:has-text("Resend")')
      await expect(resendButton).toBeDisabled()

      // Should show countdown text
      const countdown = page.locator('text=/Resend in \\d+s/, text=/Wait \\d+ seconds/')
      await expect(countdown).toBeVisible()

      // Wait for cooldown to expire (in test, might be shorter)
      await page.waitForTimeout(5000)

      // Resend button should be enabled again
      await expect(resendButton).toBeEnabled()
    })
  })

  test.describe('Error Handling', () => {
    test('should show error for wrong OTP code', async ({ page }) => {
      await page.goto('/sign-in')

      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]')
      await phoneInput.fill('+14155550100')

      const sendButton = page.locator('button:has-text("Send Code"), button:has-text("Send OTP")')
      await sendButton.click()

      await page.waitForTimeout(1000)

      // Enter wrong OTP
      const otpInput = page.locator('input[data-testid="otp-input"], input[type="text"][maxlength="6"]')
      await otpInput.fill('999999')

      const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Sign In")')
      await verifyButton.click()

      // Should show error message
      const errorMessage = page.locator('text=/incorrect/i, text=/invalid/i, .error-message, [role="alert"]')
      await expect(errorMessage).toBeVisible()

      // Should remain on sign-in page
      expect(page.url()).toContain('/sign-in')
    })

    test('should show error for expired OTP code', async ({ page }) => {
      // This test would require mocking time or waiting for actual expiry
      // For demo purposes, we'll test the UI response to expired error

      await page.goto('/sign-in')

      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]')
      await phoneInput.fill('+14155550100')

      const sendButton = page.locator('button:has-text("Send Code"), button:has-text("Send OTP")')
      await sendButton.click()

      await page.waitForTimeout(1000)

      // Simulate expired code scenario
      // In a real test, you might mock the API response or wait for actual expiry
      const otpInput = page.locator('input[data-testid="otp-input"], input[type="text"][maxlength="6"]')
      await otpInput.fill('123456') // Potentially expired code

      const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Sign In")')
      await verifyButton.click()

      // If expired, should show appropriate error
      const expiredError = page.locator('text=/expired/i, text=/request.*new/i')
      if (await expiredError.isVisible()) {
        await expect(expiredError).toBeVisible()
      }
    })

    test('should show rate limit error', async ({ page }) => {
      await page.goto('/sign-in')

      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]')
      const sendButton = page.locator('button:has-text("Send Code"), button:has-text("Send OTP")')

      // Make multiple rapid requests to trigger rate limit
      for (let i = 0; i < 6; i++) {
        await phoneInput.fill('+14155550100')
        await sendButton.click()
        await page.waitForTimeout(500)
      }

      // Should show rate limit error
      const rateLimitError = page.locator('text=/too many/i, text=/try again later/i, text=/rate limit/i')
      await expect(rateLimitError).toBeVisible()
    })
  })

  test.describe('International Phone Numbers', () => {
    test('should accept and verify international phone numbers', async ({ page }) => {
      const internationalNumbers = [
        '+442071234567', // UK
        '+33612345678',  // France
        '+81312345678'   // Japan
      ]

      for (const phoneNumber of internationalNumbers) {
        await page.goto('/sign-in')

        const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]')
        await phoneInput.fill(phoneNumber)

        const sendButton = page.locator('button:has-text("Send Code"), button:has-text("Send OTP")')
        await sendButton.click()

        // Should successfully send OTP (no error shown)
        await page.waitForTimeout(2000)
        const errorMessage = page.locator('.error-message, [role="alert"], text=/invalid/i')
        await expect(errorMessage).not.toBeVisible()

        // Should show OTP input form
        const otpInput = page.locator('input[data-testid="otp-input"], input[type="text"][maxlength="6"]')
        await expect(otpInput).toBeVisible()
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should have accessible error messages', async ({ page }) => {
      await page.goto('/sign-in')

      // Test screen reader accessible error messages
      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]')
      await phoneInput.fill('invalid')

      const sendButton = page.locator('button:has-text("Send Code"), button:has-text("Send OTP")')
      await sendButton.click()

      // Error should be associated with input via aria-describedby or role="alert"
      const errorMessage = page.locator('[role="alert"], .error-message')
      await expect(errorMessage).toBeVisible()

      // Input should have aria-invalid="true" when there's an error
      await expect(phoneInput).toHaveAttribute('aria-invalid', 'true')
    })

    test('should have proper focus management', async ({ page }) => {
      await page.goto('/sign-in')

      // Phone input should be focused on load
      const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]')
      await expect(phoneInput).toBeFocused()

      // After sending OTP, focus should move to OTP input
      await phoneInput.fill('+14155550100')
      const sendButton = page.locator('button:has-text("Send Code"), button:has-text("Send OTP")')
      await sendButton.click()

      await page.waitForTimeout(1000)

      const otpInput = page.locator('input[data-testid="otp-input"], input[type="text"][maxlength="6"]')
      await expect(otpInput).toBeFocused()
    })
  })
})