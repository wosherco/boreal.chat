import { chatTable } from "$lib/server/db/schema";
import { eq, and, isNull, lt } from "drizzle-orm";
import type { TransactableDBType } from "../db";

export async function renameChat(tx: TransactableDBType, chatId: string, newTitle: string) {
  await tx.update(chatTable).set({ title: newTitle }).where(eq(chatTable.id, chatId));
}

export async function archiveChat(tx: TransactableDBType, chatId: string) {
  await tx.update(chatTable).set({ archived: true }).where(eq(chatTable.id, chatId));
}

export async function unarchiveChat(tx: TransactableDBType, chatId: string) {
  await tx.update(chatTable).set({ archived: false }).where(eq(chatTable.id, chatId));
}

export async function deleteChat(tx: TransactableDBType, chatId: string) {
  // Soft delete: set deletedAt timestamp
  await tx.update(chatTable).set({ deletedAt: new Date() }).where(eq(chatTable.id, chatId));
}

export async function restoreChat(tx: TransactableDBType, chatId: string) {
  await tx.update(chatTable).set({ deletedAt: null }).where(eq(chatTable.id, chatId));
}

export async function permanentlyDeleteChat(tx: TransactableDBType, chatId: string) {
  // Hard delete: actually remove from database
  await tx.delete(chatTable).where(eq(chatTable.id, chatId));
}

export async function permanentlyDeleteExpiredChats(tx: TransactableDBType) {
  // Delete chats that have been soft-deleted for more than 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  await tx.delete(chatTable).where(
    and(
      lt(chatTable.deletedAt, fourteenDaysAgo)
    )
  );
}
