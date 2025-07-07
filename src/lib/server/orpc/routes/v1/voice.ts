import { osBase } from "../../context";
import { proMiddleware, ratelimitMiddleware } from "../../middlewares";
import { transcribeRatelimiter } from "$lib/server/ratelimit";
import z from "zod";
import * as Sentry from "@sentry/sveltekit";
import { ORPCError } from "@orpc/client";
import { transcribe } from "$lib/server/services/external/fireworks";
import { parseMedia } from "@remotion/media-parser";
import { env } from "$env/dynamic/public";

const MAX_DURATION = 120;

export const v1VoiceRouter = osBase.router({
  transcribe: osBase
    .use(({ next }) => {
      if (!env.PUBLIC_VOICE_INPUT_ENABLED) {
        throw new ORPCError("FORBIDDEN", {
          message: "Voice input is not enabled",
        });
      }

      return next();
    })
    .use(proMiddleware)
    .use(ratelimitMiddleware(transcribeRatelimiter))
    .input(
      z.object({
        audioBlob: z.instanceof(Blob),
        duration: z.number().max(MAX_DURATION),
      }),
    )
    .handler(async ({ input }) => {
      try {
        const media = await parseMedia({
          src: input.audioBlob,
          fields: {
            slowDurationInSeconds: true,
          },
        });

        if (!media.slowDurationInSeconds || media.slowDurationInSeconds > input.duration) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Audio is too long",
          });
        }
      } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to parse audio",
        });
      }

      try {
        const transcript = await transcribe(input.audioBlob);
        return { transcript: transcript.text };
      } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to transcribe voice message",
        });
      }
    }),
});
