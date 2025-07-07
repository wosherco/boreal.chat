CREATE TABLE "drafts" (
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
--> statement-breakpoint
CREATE INDEX "drafts_user_id_updated_at_index" ON "drafts" USING btree ("user_id","updated_at");