import { z } from "zod";

export const chatTitleSchema = z.string().min(2).max(100);
