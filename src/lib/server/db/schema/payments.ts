import { pgTable, text, timestamp, uuid, decimal, boolean, serial } from "drizzle-orm/pg-core";
import { userTable } from "./users";

export const paymentMethodsTable = pgTable("payment_methods", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  stripePaymentMethodId: text().notNull().unique(),
  type: text().notNull(), // 'card', 'bank_account', etc.
  last4: text(), // Last 4 digits for display
  brand: text(), // 'visa', 'mastercard', etc.
  expiryMonth: text(),
  expiryYear: text(),
  isDefault: boolean().default(false),
  createdAt: timestamp({ withTimezone: true }).defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow(),
});

export const creditsTable = pgTable("credits", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  amount: decimal({ precision: 10, scale: 2 }).notNull(),
  description: text(),
  type: text().notNull(), // 'purchase', 'usage', 'refund', 'bonus'
  stripePaymentIntentId: text(),
  createdAt: timestamp({ withTimezone: true }).defaultNow(),
});

export const creditTransactionsTable = pgTable("credit_transactions", {
  id: serial().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  amount: decimal({ precision: 10, scale: 2 }).notNull(), // The amount in USD
  fee: decimal({ precision: 10, scale: 2 }).notNull(), // The 8% fee
  totalAmount: decimal({ precision: 10, scale: 2 }).notNull(), // Amount + fee
  paymentMethodId: uuid().references(() => paymentMethodsTable.id),
  stripePaymentIntentId: text(),
  status: text().notNull().default('pending'), // 'pending', 'completed', 'failed', 'refunded'
  isOneTime: boolean().default(true),
  createdAt: timestamp({ withTimezone: true }).defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow(),
});

export type PaymentMethod = typeof paymentMethodsTable.$inferSelect;
export type Credit = typeof creditsTable.$inferSelect;
export type CreditTransaction = typeof creditTransactionsTable.$inferSelect;