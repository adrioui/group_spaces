ALTER TABLE "otp_verification" ADD COLUMN "verification_sid" text;--> statement-breakpoint
ALTER TABLE "otp_verification" ADD COLUMN "channel" text DEFAULT 'sms';