ALTER TABLE "message_segment_usage" ALTER COLUMN "generation_id" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "message_segments" ALTER COLUMN "generation_id" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "message_tokens" ALTER COLUMN "generation_id" SET DATA TYPE varchar(50);