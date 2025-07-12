import { z } from "zod";

export const chatTitleSchema = z
  .string()
  .trim()
  .min(2, { message: "Chat title must be at least 2 characters long" })
  .max(100, { message: "Chat title must be at most 100 characters long" });
