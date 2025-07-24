import { osBase } from "../../context";
import { ipMiddleware, turnstileMiddleware } from "../../middlewares";
import { z } from "zod/v4";
import { db } from "../../db";
import { anonymousVerificationTable } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { ORPCError } from "@orpc/client";

const verifyTurnstileInput = z.object({
  turnstileToken: z.string(),
  sessionId: z.string().optional(),
});

const verifyTurnstileOutput = z.object({
  success: z.boolean(),
  render: z.boolean().optional(),
  sessionId: z.string(),
});

export const v1VerificationRouter = {
  verifyTurnstile: osBase
    .input(verifyTurnstileInput)
    .output(verifyTurnstileOutput)
    .use(ipMiddleware)
    .use(turnstileMiddleware)
    .query(async ({ input, context }) => {
      const sessionId = input.sessionId || 'anonymous-' + context.clientIp;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Check if verification already exists for this session/IP
      const [existingVerification] = await db
        .select()
        .from(anonymousVerificationTable)
        .where(
          and(
            eq(anonymousVerificationTable.sessionId, sessionId),
            eq(anonymousVerificationTable.clientIp, context.clientIp)
          )
        )
        .limit(1);

      if (existingVerification) {
        // Update existing verification
        await db
          .update(anonymousVerificationTable)
          .set({
            verifiedAt: new Date(),
            expiresAt,
          })
          .where(eq(anonymousVerificationTable.id, existingVerification.id));
      } else {
        // Create new verification record
        await db.insert(anonymousVerificationTable).values({
          sessionId,
          clientIp: context.clientIp,
          verifiedAt: new Date(),
          expiresAt,
        });
      }

      return {
        success: true,
        sessionId,
      };
    }),

  checkVerification: osBase
    .input(z.object({
      sessionId: z.string().optional(),
    }))
    .output(z.object({
      verified: z.boolean(),
      expiresAt: z.string().optional(),
    }))
    .use(ipMiddleware)
    .query(async ({ input, context }) => {
      const sessionId = input.sessionId || 'anonymous-' + context.clientIp;

      const [verification] = await db
        .select()
        .from(anonymousVerificationTable)
        .where(
          and(
            eq(anonymousVerificationTable.sessionId, sessionId),
            eq(anonymousVerificationTable.clientIp, context.clientIp)
          )
        )
        .limit(1);

      const now = new Date();
      const isVerified = verification && verification.expiresAt > now;

      return {
        verified: !!isVerified,
        expiresAt: verification?.expiresAt?.toISOString(),
      };
    }),
};