ALTER TABLE "messages" DROP COLUMN "metadata";
CREATE TABLE "message_segment_metadata" (
  "message_segment_id" uuid PRIMARY KEY NOT NULL REFERENCES "message_segments"("id") ON DELETE cascade,
  "prompt_tokens" integer NOT NULL,
  "completion_tokens" integer NOT NULL,
  "reasoning_tokens" integer NOT NULL DEFAULT 0,
  "cached_tokens" integer NOT NULL DEFAULT 0,
  "total_tokens" integer NOT NULL,
  "cost" double precision NOT NULL,
  "upstream_inference_cost" double precision
);
