ALTER TABLE "chats" ADD COLUMN "archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "deleted_at" timestamp with time zone;