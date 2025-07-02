import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { fetchAllChatMessages } from "$lib/server/services/messages";
import { error, redirect } from "@sveltejs/kit";
import { ORPCError } from "@orpc/client";
import { getChatShare } from "$lib/server/services/shares";
import { chatTable } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
  const { shareId } = params;

  let chatId: string;
  try {
    const chatShare = await getChatShare(shareId, locals.user?.email ?? undefined);
    chatId = chatShare.chatId;
  } catch (e) {
    if (e instanceof ORPCError) {
      throw error(e.status, e.message);
    }

    throw e;
  }

  // If user is logged in and is the owner of the chat, redirect to the original chat
  if (locals.user) {
    const [chat] = await db
      .select({ userId: chatTable.userId })
      .from(chatTable)
      .where(eq(chatTable.id, chatId))
      .limit(1);

    if (chat && chat.userId === locals.user.id) {
      throw redirect(302, `/chat/${chatId}`);
    }
  }

  setHeaders({ "X-Robots-Tag": "noindex" });

  const chatMessages = await fetchAllChatMessages(db, chatId);

  return {
    share: {
      chatId,
      messages: chatMessages,
      isSharedView: true,
    },
  };
};
