import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import { z } from "zod";
import { CHUNK_SIZE, isMultiPart, MAX_FILE_SIZE } from "$lib/common/utils/files";
import {
  abortMultiPartUpload,
  confirmMultiPartUpload,
  generateMultiPartUploadParams,
  generateSinglePartUploadParams,
} from "$lib/server/services/files/s3";
import { ORPCError } from "@orpc/client";
import { verifyJwt } from "$lib/server/jwt";

export const v1FilesRouter = osBase.router({
  uploadSinglePartFile: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.string(),
        size: z.number().min(1).max(CHUNK_SIZE),
        hash: z.string().describe("SHA256 hash of the file"),
      }),
    )
    .handler(async ({ context, input }) => {
      if (!isMultiPart(input.size)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "File size is too small to be uploaded in multiple parts",
        });
      }

      const file = await generateSinglePartUploadParams(
        context.userCtx.user.id,
        input.fileName,
        input.contentType,
        input.size,
        input.hash,
      );

      return file;
    }),

  uploadMultiPartFile: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.string(),
        size: z.number().min(CHUNK_SIZE).max(MAX_FILE_SIZE),
        parts: z.array(
          z.object({
            partNumber: z.number(),
            hash: z.string(),
          }),
        ),
        hash: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const file = await generateMultiPartUploadParams(
        context.userCtx.user.id,
        input.fileName,
        input.contentType,
        input.size,
        input.parts,
        input.hash,
      );

      return file;
    }),

  finishMultiPartUpload: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        uploadToken: z.string(),
        uploadId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const fileMetadata = await verifyJwt(input.uploadToken);

      if (fileMetadata.userId !== context.userCtx.user.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "You are not allowed to finish this upload",
        });
      }

      const file = await confirmMultiPartUpload(input.uploadId, fileMetadata);

      return file;
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

      const file = await abortMultiPartUpload(input.uploadId, fileMetadata);
      return file;
    }),
});
