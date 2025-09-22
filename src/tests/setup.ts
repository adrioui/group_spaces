import '@testing-library/jest-dom'
import { execSync } from 'child_process'
import path from 'path'

// Load test environment variables
const envPath = path.join(process.cwd(), '.env.test')
try {
  const envContent = require('fs').readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach((line: string) => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key] = value
    }
  })
} catch (error) {
  console.warn('No .env.test file found, using default test environment variables')
}

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}))

// Mock Twilio for all tests
vi.mock('twilio', () => {
  const mockMessage = {
    sid: 'mock-message-sid',
    status: 'sent',
    to: '',
    from: '',
    body: '',
  }

  const mockClient = {
    messages: {
      create: vi.fn().mockResolvedValue(mockMessage),
    },
  }

  return {
    default: vi.fn(() => mockClient),
    __esModule: true,
  }
})

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || 'test-secret-key-that-is-at-least-32-characters-long'
process.env.NEXT_PUBLIC_BETTER_AUTH_URL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://dev:dev@localhost:5432/group_spaces_test'
process.env.TWILIO_MOCK = 'true'

// Database cleanup function
export const cleanupDatabase = async () => {
  try {
    // Fast cleanup - truncate tables
    execSync('bash scripts/cleanup-test-db.sh truncate', {
      stdio: 'pipe',
      cwd: process.cwd()
    })
  } catch (error) {
    console.warn('Database cleanup failed:', error)
  }
}

// Setup database before all tests
beforeAll(async () => {
  // Ensure test database exists and is migrated
  try {
    execSync('env $(cat .env.test | xargs) npm run db:migrate', {
      stdio: 'pipe',
      cwd: process.cwd()
    })
  } catch (error) {
    console.warn('Database migration failed:', error)
  }
})

// Cleanup database before each test for isolation
beforeEach(async () => {
  await cleanupDatabase()
})

// Suppress console logs in tests unless debugging
if (!process.env.DEBUG) {
  const originalConsole = { ...console }
  console.log = vi.fn()
  console.error = vi.fn()
  console.warn = vi.fn()

  // Allow specific debug logs for OTP testing
  console.log = vi.fn().mockImplementation((...args) => {
    const message = args.join(' ')
    if (message.includes('[DEV MODE] OTP') || message.includes('OTP:')) {
      originalConsole.log(...args)
    }
  })
}

// Global test utilities
global.testUtils = {
  cleanupDatabase,
  mockOTP: (code: string = '123456') => {
    // Mock console.log to capture OTP
    const originalLog = console.log
    console.log = vi.fn().mockImplementation((...args) => {
      const message = args.join(' ')
      if (message.includes('Code:')) {
        // Replace with our mock code
        originalLog(message.replace(/Code: \d{6}/, `Code: ${code}`))
      } else {
        originalLog(...args)
      }
    })
    return code
  },
}