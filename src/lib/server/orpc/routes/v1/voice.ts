import { osBase } from "../../context";
import { subscribedMiddleware, ratelimitMiddleware } from "../../middlewares";
import { transcribeRatelimiter } from "$lib/server/ratelimit";
import z from "zod";
import * as Sentry from "@sentry/sveltekit";
import { ORPCError } from "@orpc/client";
import { transcribe } from "$lib/server/services/external/fireworks";
import { parseMedia } from "@remotion/media-parser";
import { env } from "$env/dynamic/public";
import { posthog } from "$lib/server/posthog";

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
    .use(subscribedMiddleware)
    .use(ratelimitMiddleware(transcribeRatelimiter))
    .input(
      z.object({
        audioBlob: z.instanceof(Blob),
        duration: z.number().max(MAX_DURATION),
      }),
    )
    .handler(async ({ input, context }) => {
      let duration = input.duration;

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

        duration = media.slowDurationInSeconds;
      } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to parse audio",
        });
      }

      try {
        const transcript = await transcribe(input.audioBlob);

        posthog?.capture({
          distinctId: context.userCtx.user.id,
          event: "voice_message_transcribed",
          properties: {
            duration,
            model: "fireworks-whisper-v3-large",
          },
        });

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
