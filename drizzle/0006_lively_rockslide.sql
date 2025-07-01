CREATE TABLE "chat_share" (
	"chat_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"privacy" varchar(20) DEFAULT 'private' NOT NULL,
	"allowed_emails" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_share" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"privacy" varchar(20) DEFAULT 'private' NOT NULL,
	"allowed_emails" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread_share" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"last_message_id" uuid NOT NULL,
	"privacy" varchar(20) DEFAULT 'private' NOT NULL,
	"allowed_emails" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_share" ADD CONSTRAINT "chat_share_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_share" ADD CONSTRAINT "chat_share_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_share" ADD CONSTRAINT "message_share_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_share" ADD CONSTRAINT "message_share_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_share" ADD CONSTRAINT "thread_share_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_share" ADD CONSTRAINT "thread_share_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_share" ADD CONSTRAINT "thread_share_last_message_id_messages_id_fk" FOREIGN KEY ("last_message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;