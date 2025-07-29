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
ALTER TABLE "byok" DROP CONSTRAINT "byok_user_id_user_id_fk";
--> statement-breakpoint
CREATE INDEX "assets_asset_id_index" ON "assets" USING btree ("asset_id");