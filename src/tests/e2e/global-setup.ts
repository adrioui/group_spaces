import { chromium, FullConfig } from '@playwright/test'
import { execSync } from 'child_process'

async function globalSetup(config: FullConfig) {
  console.log('🧪 E2E Test Environment Setup Starting...')

  // Set up test environment variables
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = 'postgres://dev:dev@localhost:5432/group_spaces_test'
  process.env.BETTER_AUTH_SECRET = 'test-secret-key-that-is-at-least-32-characters-long'
  process.env.TWILIO_MOCK = 'true'

  // Ensure test database is set up and migrated
  try {
    console.log('📊 Setting up test database...')

    // Reset database with fresh migrations
    execSync('bash scripts/cleanup-test-db.sh reset', {
      stdio: 'inherit',
      cwd: process.cwd()
    })

    console.log('✅ Test database ready')
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    throw error
  }

  console.log('🎉 E2E Test Environment Setup Complete')
  console.log('   - Database: PostgreSQL (test)')
  console.log('   - OTP delivery: mocked (check console logs)')
  console.log('   - Auth: test mode')
}

export default globalSetup