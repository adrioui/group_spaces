// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

// Environment validation
const requiredEnvVars = [
  'BETTER_AUTH_SECRET',
  'DATABASE_URL',
];

// Only require Twilio vars in production
if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.push(
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER'
  );
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

if (process.env.BETTER_AUTH_SECRET!.length < 32) {
  throw new Error('BETTER_AUTH_SECRET must be at least 32 characters long');
}

// Rate limiting maps (in-memory for dev, use Redis in prod)
const rateLimitMaps = {
  ip: new Map<string, { count: number; resetAt: number }>(),
  phone: new Map<string, { count: number; resetAt: number; lastSentAt?: number }>(),
};

// Rate limiting config
const RATE_LIMITS = {
  sendOTP: {
    perMinute: { phone: 5, ip: 30 },
    perDay: { phone: 20 },
    resendCooldown: 60 * 1000, // 60 seconds
  },
  verifyOTP: {
    perMinute: { phone: 10 },
  },
};

// Rate limiter helper
function checkRateLimit(
  key: string,
  map: Map<string, { count: number; resetAt: number; lastSentAt?: number }>,
  limit: number,
  windowMs: number,
  cooldownMs?: number
): { allowed: boolean; error?: string } {
  const now = Date.now();
  const entry = map.get(key);

  if (entry) {
    // Check cooldown
    if (cooldownMs && entry.lastSentAt && now - entry.lastSentAt < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - (now - entry.lastSentAt)) / 1000);
      return {
        allowed: false,
        error: `Please wait ${remainingSeconds} seconds before requesting a new code`,
      };
    }

    // Check rate limit
    if (now < entry.resetAt) {
      if (entry.count >= limit) {
        return {
          allowed: false,
          error: `Too many requests. Please try again later`,
        };
      }
      entry.count++;
      entry.lastSentAt = now;
    } else {
      // Reset window
      map.set(key, { count: 1, resetAt: now + windowMs, lastSentAt: now });
    }
  } else {
    map.set(key, { count: 1, resetAt: now + windowMs, lastSentAt: now });
  }

  return { allowed: true };
}

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
    usePlural: true,
    schema: {
      user: schema.user,
      users: schema.user, // Better Auth expects "users" plural
      session: schema.session,
      sessions: schema.session, // Better Auth expects "sessions" plural
      account: schema.account,
      accounts: schema.account, // Better Auth expects "accounts" plural
      verification: schema.verification,
      verifications: schema.verification, // Better Auth expects "verifications" plural
    }
	}),
	emailAndPassword: {
		enabled: false, // Disable email/password for OTP-only auth
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	basePath: "/api/auth",
	secret: process.env.BETTER_AUTH_SECRET!,
	plugins: [
		phoneNumber({
			sendOTP: async (phoneNumberObj, code, request) => {
				try {
					// Extract phone number and normalize to E.164
					const phoneNumber = phoneNumberObj.phoneNumber || phoneNumberObj;

					// Validate phone number
					if (!isValidPhoneNumber(phoneNumber)) {
						return { success: false, error: 'Invalid phone number format' };
					}

					// Parse and format to E.164
					const parsed = parsePhoneNumber(phoneNumber);
					if (!parsed) {
						return { success: false, error: 'Invalid phone number' };
					}

					const formattedPhone = parsed.format('E.164');

					// Rate limiting checks
					// Check phone rate limit
					const phoneLimit = checkRateLimit(
						formattedPhone,
						rateLimitMaps.phone,
						RATE_LIMITS.sendOTP.perMinute.phone,
						60 * 1000,
						RATE_LIMITS.sendOTP.resendCooldown
					);

					if (!phoneLimit.allowed) {
						return { success: false, error: phoneLimit.error };
					}

					// Check IP rate limit if available
					const ip = request?.headers?.get('x-forwarded-for') ||
					         request?.headers?.get('x-real-ip') ||
					         'unknown';

					if (ip !== 'unknown') {
						const ipLimit = checkRateLimit(
							ip,
							rateLimitMaps.ip,
							RATE_LIMITS.sendOTP.perMinute.ip,
							60 * 1000
						);

						if (!ipLimit.allowed) {
							return { success: false, error: ipLimit.error };
						}
					}

					// Development mode: log OTP instead of sending
					if (process.env.NODE_ENV !== 'production') {
						console.log('\n📱 [DEV MODE] OTP Request:');
						console.log(`   Phone: ${formattedPhone}`);
						console.log(`   Code: ${code}`);
						console.log(`   Time: ${new Date().toISOString()}\n`);
						return { success: true };
					}

					// Production mode: send via Twilio
					const twilio = await import('twilio');
					const client = twilio.default(
						process.env.TWILIO_ACCOUNT_SID!,
						process.env.TWILIO_AUTH_TOKEN!
					);

					const message = await client.messages.create({
						body: `Your verification code is: ${code}`,
						from: process.env.TWILIO_PHONE_NUMBER!,
						to: formattedPhone
					});

					console.log('✅ Twilio message sent:', message.sid);
					return { success: true };
				} catch (error) {
					console.error('❌ Failed to send OTP:', error);
					return {
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error'
					};
				}
			},
			verifyOTP: {
				rateLimit: {
					window: 60,
					max: 10,
				},
			},
		}),
	],
	onError: (error, context) => {
		console.error('Better Auth Error:', {
			error: error.message,
			context: context.path,
			timestamp: new Date().toISOString(),
		});
	},
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
