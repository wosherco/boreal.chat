import { z } from "zod";
import * as m from "../../paraglide/messages";

export const chatTitleSchema = z
  .string()
  .trim()
  .min(2, { message: m.error_chatTitleTooShort() })
  .max(100, { message: m.error_chatTitleTooLong() });
