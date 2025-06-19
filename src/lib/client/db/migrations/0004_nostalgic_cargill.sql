CREATE INDEX "chat_title_trgm_index" ON "chats" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "message_segments_content_trgm_index" ON "message_segments" USING gin ("content" gin_trgm_ops);
