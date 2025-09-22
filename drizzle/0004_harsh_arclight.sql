ALTER TABLE "otp_verification" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "otp_verification" CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_phone_number_unique" UNIQUE("phone_number");