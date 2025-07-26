CREATE TABLE "byok" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"api_key" text NOT NULL,
	"platform" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'ANONYMOUS';--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "byok_id" uuid;--> statement-breakpoint
ALTER TABLE "byok" ADD CONSTRAINT "byok_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;