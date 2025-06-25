CREATE TABLE "message_segment_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"generation_id" uuid NOT NULL,
	"is_byok" boolean DEFAULT false NOT NULL,
	"model" text,
	"origin" text,
	"provider_name" text,
	"usage" double precision,
	"cache_discount" double precision,
	"tokens_prompt" integer,
	"tokens_completion" integer,
	"num_media_prompt" integer,
	"num_media_completion" integer,
	"num_search_results" integer,
	CONSTRAINT "message_segment_usage_generationId_unique" UNIQUE("generation_id")
);
--> statement-breakpoint
ALTER TABLE "message_segments" ADD COLUMN "generation_id" uuid;--> statement-breakpoint
ALTER TABLE "message_tokens" ADD COLUMN "generation_id" uuid;--> statement-breakpoint
ALTER TABLE "message_segment_usage" ADD CONSTRAINT "message_segment_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "metadata";