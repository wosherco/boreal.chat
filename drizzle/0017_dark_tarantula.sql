CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_type" varchar(50) NOT NULL,
	"asset_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "assets_assetId_assetType_unique" UNIQUE("asset_id","asset_type")
);
--> statement-breakpoint
CREATE TABLE "draft_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "s3_file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"file_name" text NOT NULL,
	"size" integer NOT NULL,
	"content_type" text NOT NULL,
	"hash" text,
	"thumbnail_key" text,
	"ai_file_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "s3_file_key_unique" UNIQUE("key"),
	CONSTRAINT "s3_file_hash_userId_unique" UNIQUE("hash","user_id")
);
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_parent_message_id_messages_id_fk";
--> statement-breakpoint
ALTER TABLE "byok" DROP CONSTRAINT "byok_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "draft_attachments" ADD CONSTRAINT "draft_attachments_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_attachments" ADD CONSTRAINT "draft_attachments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "s3_file" ADD CONSTRAINT "s3_file_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_asset_id_index" ON "assets" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "s3_file_user_id_index" ON "s3_file" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_parent_message_id_messages_id_fk" FOREIGN KEY ("parent_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "byok" ADD CONSTRAINT "byok_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;