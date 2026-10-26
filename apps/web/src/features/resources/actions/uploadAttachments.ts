import type { Admin, Member } from "@repo/shared/payload-types"
import { type Payload, type PayloadRequest, ValidationError } from "payload"
import { Slugs } from "@/lib/payload/slugs"

type UploadResult = { ids: number[] } | { fieldError: string }

/**
 * Uploads a resource's new attachments as `user`, in the caller's transaction. A file Payload
 * refuses comes back as a field error naming it, for the caller to roll back on; anything
 * else is thrown. Not a server action - only createResource and updateResource call it.
 */
export const uploadAttachments = async (
  payload: Payload,
  files: readonly File[],
  { req, user }: { req: Partial<PayloadRequest> | undefined; user: Admin | Member },
): Promise<UploadResult> => {
  const ids: number[] = []
  for (const file of files) {
    try {
      const attachment = await payload.create({
        collection: Slugs.Collections.RESOURCE_ATTACHMENTS,
        data: {},
        file: {
          data: Buffer.from(await file.arrayBuffer()),
          mimetype: file.type,
          name: file.name,
          size: file.size,
        },
        overrideAccess: false,
        req,
        user,
      })
      ids.push(attachment.id)
    } catch (error) {
      // Payload checks each file's contents (e.g. a PDF that isn't really one), and its
      // message names no file, so the field error says which one it was.
      if (error instanceof ValidationError) {
        const message = error.data?.errors?.[0]?.message ?? "This file could not be uploaded."
        return { fieldError: `${file.name}: ${message}` }
      }
      throw error
    }
  }
  return { ids }
}
