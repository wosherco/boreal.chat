ALTER TABLE "message_segment_usage" ADD COLUMN "estimated_c_us" integer;--> statement-breakpoint
ALTER TABLE "message_segment_usage" ADD COLUMN "actual_c_us" integer;--> statement-breakpoint
ALTER TABLE "message_segment_usage" ADD COLUMN "private" boolean DEFAULT false NOT NULL;