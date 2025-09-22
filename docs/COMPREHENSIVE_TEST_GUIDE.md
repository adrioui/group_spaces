# Comprehensive OTP Authentication Testing Guide

## **Critical Setup Steps (Must Complete First)**

### **1. Environment Variables Setup**

Create/update `.env.local` with ALL required variables:

```env
# Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:[YOUR-PORT]/postgres"

# Better Auth (still needed for existing tables)
BETTER_AUTH_SECRET="[YOUR_BETTER_AUTH_SECRET]"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# Twilio Configuration (for production testing)
TWILIO_ACCOUNT_SID=[YOUR_TWILIO_ACCOUNT_SID]
TWILIO_AUTH_TOKEN=[YOUR_TWILIO_AUTH_TOKEN]
TWILIO_VERIFY_SERVICE_ID=[YOUR_TWILIO_VERIFY_SERVICE_ID]

# JWT Session Management
JWT_SECRET=[YOUR_JWT_SECRET]
JWT_REFRESH_SECRET=[YOUR_JWT_REFRESH_SECRET]

# Development Settings
NODE_ENV=development
USE_MOCK_TWILIO=true

# Supabase
NEXT_PUBLIC_SUPABASE_URL="[YOUR_SUPABASE_URL]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SUPABASE_SERVICE_ROLE_KEY]"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_SUPABASE_ANON_KEY]"
```

### **2. Database Setup**

```bash
# Generate migrations from schema changes
npm run db:generate

# Push migrations to database
npm run db:migrate

# Optional: Open database studio to verify
npm run db:studio
```

### **3. Verify Service Integration**

The API routes have been updated to use the factory pattern:
- `src/app/api/auth/phone/send-otp/route.ts` ✅ Updated
- `src/app/api/auth/phone/verify-otp/route.ts` ✅ Updated

## **Comprehensive Testing Plan**

### **Test 1: Basic OTP Flow (Mock Mode)**

```bash
# Start development server
npm run dev

# Test 1.1: Send OTP
curl -X POST http://localhost:3000/api/auth/phone/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'

# Expected: {"success":true, "message":"Mock OTP sent via sms...", "verificationId":"...", "expiresAt":"..."}

# Test 1.2: Get OTP code from debug endpoint
curl "http://localhost:3000/api/dev/otp-debug?phone=%2B1234567890"

# Expected: {"phone":"+1234567890", "code":"123456", "found":true}

# Test 1.3: Verify OTP
curl -X POST http://localhost:3000/api/auth/phone/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "code": "123456"}'

# Expected: User created with session tokens, isNewUser: true
```

### **Test 2: Existing User Login**

```bash
# Send OTP to same phone
curl -X POST http://localhost:3000/api/auth/phone/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'

# Get new code and verify
curl "http://localhost:3000/api/dev/otp-debug?phone=%2B1234567890"
curl -X POST http://localhost:3000/api/auth/phone/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "code": "NEW_CODE"}'

# Expected: Same user ID, isNewUser: false, new session tokens
```

### **Test 3: Input Validation**

```bash
# Test 3.1: Invalid phone number (too short)
curl -X POST http://localhost:3000/api/auth/phone/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "123"}'

# Expected: {"success":false, "message":"Invalid phone number format"}, 400

# Test 3.2: Missing phone number
curl -X POST http://localhost:3000/api/auth/phone/send-otp \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# Expected: {"success":false, "message":"Phone number is required"}, 400

# Test 3.3: Invalid OTP code format
curl -X POST http://localhost:3000/api/auth/phone/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "code": "abc"}'

# Expected: {"success":false, "message":"OTP code must contain only numbers"}, 400
```

### **Test 4: Security Features**

```bash
# Test 4.1: Rate limiting - send multiple OTPs quickly
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/auth/phone/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phone": "+1111111111"}'
  sleep 1
done

# Expected: First 3 succeed, 4th returns rate limited error

# Test 4.2: Max OTP attempts
curl -X POST http://localhost:3000/api/auth/phone/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2222222222"}'

# Get code and try wrong verification 6 times
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/phone/verify-otp \
    -H "Content-Type: application/json" \
    -d '{"phone": "+2222222222", "code": "000000"}'
done

# Expected: After 5 attempts, returns "Maximum verification attempts reached"
```

### **Test 5: Error Handling**

```bash
# Test 5.1: Verify non-existent OTP
curl -X POST http://localhost:3000/api/auth/phone/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+9999999999", "code": "123456"}'

# Expected: {"success":false, "message":"No pending OTP found"}, 404

# Test 5.2: Verify expired OTP
# Send OTP, wait 10+ minutes, then try to verify

# Test 5.3: Invalid JSON
curl -X POST http://localhost:3000/api/auth/phone/send-otp \
  -H "Content-Type: application/json" \
  -d 'invalid json'

# Expected: 400 Bad Request
```

### **Test 6: Database Operations Verification**

```bash
# After running tests, check database state
npm run db:studio

# Verify these tables have data:
# - user table: Should have 2 users (from our tests)
# - otp_verification table: Should have verification records
# - session table: Should have session records
```

## **Production Testing (When Ready)**

### **Switch to Real Twilio**

Update `.env.local`:
```env
USE_MOCK_TWILIO=false  # or remove this line
```

### **Test with Real Phone Numbers**

```bash
# Use your real phone number
curl -X POST http://localhost:3000/api/auth/phone/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+YOUR_REAL_PHONE_NUMBER"}'

# Check your phone for actual SMS
curl -X POST http://localhost:3000/api/auth/phone/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+YOUR_REAL_PHONE_NUMBER", "code": "CODE_FROM_SMS"}'
```

## **Troubleshooting**

### **Common Issues**

1. **Mock service not working:**
   - Verify `NODE_ENV=development` and `USE_MOCK_TWILIO=true`
   - Check server logs for `[TWILIO] Using mock service` message

2. **Database connection errors:**
   - Verify `DATABASE_URL` is correct
   - Run `npm run db:migrate` again

3. **JWT errors:**
   - Verify both `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
   - Secrets must be at least 32 characters

4. **Migration errors:**
   - Check database connection
   - Verify Drizzle config is correct

### **Debug Endpoints (Development Only)**

```bash
# View all active mock OTPs
curl http://localhost:3000/api/dev/otp-debug

# Clear all mock OTPs
curl -X DELETE http://localhost:3000/api/dev/otp-debug
```

## **Security Checklist for Production**

- [ ] Change JWT secrets to strong, random values
- [ ] Set up proper Twilio credentials
- [ ] Enable rate limiting in production
- [ ] Set up error monitoring
- [ ] Configure proper CORS settings
- [ ] Remove or secure debug endpoints
- [ ] Set up database backups
- [ ] Configure proper SSL/TLS
- [ ] Set up logging and monitoring

## **API Response Examples**

### **Success Responses**
```json
// Send OTP Success
{
  "success": true,
  "message": "Mock OTP sent via sms. Check console for code.",
  "verificationId": "abc123",
  "expiresAt": "2025-09-21T14:30:00.000Z"
}

// Verify OTP Success (New User)
{
  "success": true,
  "message": "OTP verified successfully",
  "verified": true,
  "user": {
    "id": "user123",
    "phone": "+1234567890",
    "name": null,
    "email": null,
    "isNewUser": true
  },
  "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2025-09-21T15:30:00.000Z"
}
```

### **Error Responses**
```json
// Validation Error
{
  "success": false,
  "message": "Invalid phone number format"
}

// Rate Limited
{
  "success": false,
  "message": "Too many attempts. Please try again in 5 minutes.",
  "rateLimited": true
}

// OTP Expired/Invalid
{
  "success": false,
  "message": "Invalid OTP code",
  "attemptsRemaining": 3
}
```