ALTER TABLE "message_share" ADD COLUMN "chat_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "thread_share" ADD COLUMN "chat_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "message_share" ADD CONSTRAINT "message_share_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_share" ADD CONSTRAINT "thread_share_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;