import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import { z } from "zod";
import { isMultiPart, MAX_FILE_SIZE, MINIMUM_SIZE_FOR_MULTIPART } from "$lib/common/utils/files";
import {
  abortMultiPartUpload,
  confirmMultiPartUpload,
  finishFileUpload,
  generateMultiPartUploadParams,
  generateSinglePartUploadParams,
  getFileWithHash,
} from "$lib/server/services/files/s3";
import { ORPCError } from "@orpc/client";
import { verifyJwt } from "$lib/server/jwt";
import { hashStringSchema } from "$lib/common/validators/files";

export const v1FilesRouter = osBase.router({
  uploadSinglePartFile: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.string(),
        size: z
          .number()
          .min(1)
          .max(MINIMUM_SIZE_FOR_MULTIPART + 1),
        hash: hashStringSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      if (isMultiPart(input.size)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "File size is too big to be uploaded in a single part",
        });
      }

      const existingFile = await getFileWithHash(context.userCtx.user.id, input.hash);

      if (existingFile) {
        return {
          existing: true,
          data: {
            assetId: existingFile.assets.assetId,
          },
        } as const;
      }

      const file = await generateSinglePartUploadParams(
        context.userCtx.user.id,
        input.fileName,
        input.contentType,
        input.size,
        input.hash,
      );

      return {
        existing: false,
        data: file,
      } as const;
    }),

  finishSinglePartFile: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        uploadToken: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const fileMetadata = await verifyJwt(input.uploadToken);

      if (fileMetadata.userId !== context.userCtx.user.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "You are not allowed to finish this upload",
        });
      }

      const file = await finishFileUpload(fileMetadata);

      return {
        assetId: file.asset.assetId,
      };
    }),

  uploadMultiPartFile: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.string(),
        size: z.number().min(MINIMUM_SIZE_FOR_MULTIPART).max(MAX_FILE_SIZE),
        hash: hashStringSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      if (!isMultiPart(input.size)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "File size is too small to be uploaded in multiple parts",
        });
      }

      const existingFile = await getFileWithHash(context.userCtx.user.id, input.hash);

      if (existingFile) {
        return {
          existing: true,
          data: {
            assetId: existingFile.assets.assetId,
          },
        } as const;
      }

      const file = await generateMultiPartUploadParams(
        context.userCtx.user.id,
        input.fileName,
        input.contentType,
        input.size,
        input.hash,
      );

      return {
        existing: false,
        data: file,
      } as const;
    }),

  finishMultiPartUpload: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        uploadToken: z.string(),
        uploadId: z.string(),
        parts: z.array(
          z.object({
            partNumber: z.number(),
            etag: z.string(),
          }),
        ),
      }),
    )
    .handler(async ({ context, input }) => {
      const fileMetadata = await verifyJwt(input.uploadToken);

      if (fileMetadata.userId !== context.userCtx.user.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "You are not allowed to finish this upload",
        });
      }

      const file = await confirmMultiPartUpload(input.uploadId, fileMetadata, input.parts);

      return {
        assetId: file.asset.assetId,
      };
    }),

  abortMultiPartUpload: osBase
    .use(authenticatedMiddleware)
    .input(z.object({ uploadToken: z.string(), uploadId: z.string() }))
    .handler(async ({ context, input }) => {
      const fileMetadata = await verifyJwt(input.uploadToken);

      if (fileMetadata.userId !== context.userCtx.user.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "You are not allowed to abort this upload",
        });
      }

      await abortMultiPartUpload(input.uploadId, fileMetadata);

      return {
        success: true,
      };
    }),
});
