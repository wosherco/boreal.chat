import { chatTable } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { TransactableDBType } from "../db";

export async function renameChat(tx: TransactableDBType, chatId: string, newTitle: string) {
  await tx.update(chatTable).set({ title: newTitle }).where(eq(chatTable.id, chatId));
}

export async function deleteChat(tx: TransactableDBType, chatId: string) {
  await tx.delete(chatTable).where(eq(chatTable.id, chatId));
}
