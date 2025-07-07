CREATE TABLE IF NOT EXISTS "drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"selected_model" varchar(50) NOT NULL,
	"reasoning_level" varchar(50) DEFAULT 'none' NOT NULL,
	"web_search_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "drafts_user_id_updated_at_idx" ON "drafts" USING btree ("user_id","updated_at");

ALTER TABLE "drafts" ADD CONSTRAINT "drafts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;