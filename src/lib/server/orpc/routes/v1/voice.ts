import { osBase } from "../../context";
import { creditsMiddleware, ratelimitMiddleware } from "../../middlewares";
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
    .use(creditsMiddleware)
    .use(ratelimitMiddleware(transcribeRatelimiter))
    .input(
      z.object({
        audioBlob: z.instanceof(Blob),
        duration: z.number().max(MAX_DURATION),
      }),
    )
    .handler(async ({ input, context }) => {
      let duration = input.duration;

      const media = await parseMedia({
        src: input.audioBlob,
        fields: {
          slowDurationInSeconds: true,
        },
      }).catch((error) => {
        console.error(error);
        Sentry.captureException(error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to parse audio",
        });
      });

      duration = media.slowDurationInSeconds;

      if (isNaN(duration) || duration > MAX_DURATION) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Audio is too long",
        });
      }

      const transcript = await transcribe(input.audioBlob).catch((error) => {
        console.error(error);
        Sentry.captureException(error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to transcribe voice message",
        });
      });

      posthog?.capture({
        distinctId: context.userCtx.user.id,
        event: "voice_message_transcribed",
        properties: {
          duration,
          model: "fireworks-whisper-v3-large",
        },
      });

      return { transcript: transcript.text };
    }),
});
