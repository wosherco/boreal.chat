import z from "zod";

export const hashStringSchema = z
  .string()
  .describe("SHA512 hash of the file")
  .min(128, { message: "Hash must be at 128 characters long" })
  .max(128, { message: "Hash must be at 128 characters long" });
