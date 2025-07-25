ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'ANONYMOUS';--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "captcha_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "verified_client_ip" text;