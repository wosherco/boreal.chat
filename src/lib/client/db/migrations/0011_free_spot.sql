DROP TABLE "message_tokens" CASCADE;--> statement-breakpoint
ALTER TABLE "message_segments" ADD COLUMN "streaming" boolean DEFAULT true NOT NULL;