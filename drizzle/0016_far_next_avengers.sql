CREATE TABLE "anonymous_user_conversion" (
	"id" serial PRIMARY KEY NOT NULL,
	"anonymous_user_id" uuid NOT NULL,
	"new_user_id" uuid NOT NULL,
	"transfer_content" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "openrouter_key" RENAME TO "byok";--> statement-breakpoint
ALTER TABLE "byok" DROP CONSTRAINT "openrouter_key_userId_unique";--> statement-breakpoint
ALTER TABLE "byok" DROP CONSTRAINT "openrouter_key_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'ANONYMOUS';--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "captcha_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "verified_client_ip" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "byok_id" uuid;--> statement-breakpoint
ALTER TABLE "byok" ADD COLUMN "platform" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "anonymous_user_conversion" ADD CONSTRAINT "anonymous_user_conversion_anonymous_user_id_user_id_fk" FOREIGN KEY ("anonymous_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anonymous_user_conversion" ADD CONSTRAINT "anonymous_user_conversion_new_user_id_user_id_fk" FOREIGN KEY ("new_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "byok" ADD CONSTRAINT "byok_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "byok" DROP COLUMN "open_router_user_id";--> statement-breakpoint
ALTER TABLE "byok" ADD CONSTRAINT "byok_userId_platform_unique" UNIQUE("user_id","platform");