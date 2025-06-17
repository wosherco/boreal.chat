ALTER TABLE "messages" ADD COLUMN "reasoning_level" varchar(50) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "web_search_enabled" boolean DEFAULT false NOT NULL;