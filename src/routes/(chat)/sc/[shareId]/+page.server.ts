import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { fetchAllChatMessages } from "$lib/server/services/messages";
import { error } from "@sveltejs/kit";
import { ORPCError } from "@orpc/client";
import { getChatShare } from "$lib/server/services/shares";

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

  setHeaders({ "X-Robots-Tag": "noindex" });

  const chatMessages = await fetchAllChatMessages(db, chatId);

  return {
    share: {
      chatId,
      messages: chatMessages,
    },
  };
};
