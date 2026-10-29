"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { APIError } from "payload"
import { z } from "zod"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { RESOURCE_DELETE } from "@/payload/access/Resources"

const inputSchema = z.object({ resourceId: z.number().int().positive() })

const FALLBACK_ERROR = "Could not delete this resource. Try again."

/**
 * Deletes a resource and its attached files, in one transaction. Admin-only: members
 * can't delete attachment rows, so their deleteResource leaves the files. A file that
 * another resource also links to is kept for that resource.
 *
 * RESOURCE_DELETE is what lets an admin past resourceDelete. A rollback can't restore
 * a stored file that was already removed, so attachments go last. A failure part way
 * through them can still leave a row without its file.
 */
export const deleteResourceAndAttachments = async (input: unknown): Promise<ActionResult> => {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { formError: FALLBACK_ERROR, ok: false }

  const { collection, user } = await getCurrentUser()
  if (!user) return { formError: "Sign in to delete a resource.", ok: false }
  if (collection !== Slugs.Collections.ADMIN) {
    return { formError: "Only an admin can delete a resource with its files.", ok: false }
  }

  const { resourceId } = parsed.data
  const payload = await getPayloadClient()
  const transactionID = await payload.db.beginTransaction()
  const req = transactionID ? { transactionID } : undefined

  try {
    const resource = await payload.findByID({
      collection: Slugs.Collections.RESOURCES,
      depth: 0,
      id: resourceId,
      overrideAccess: false,
      req,
      user,
    })

    await payload.delete({
      collection: Slugs.Collections.RESOURCES,
      context: { [RESOURCE_DELETE]: true },
      id: resourceId,
      overrideAccess: false,
      req,
      user,
    })

    // The resource is already gone in this transaction, so the count finds only others.
    for (const attachment of resource.attachments ?? []) {
      const attachmentId = typeof attachment === "object" ? attachment.id : attachment
      const { totalDocs: linkedElsewhere } = await payload.count({
        collection: Slugs.Collections.RESOURCES,
        overrideAccess: false,
        req,
        user,
        where: { attachments: { contains: attachmentId } },
      })
      if (linkedElsewhere) continue

      await payload.delete({
        collection: Slugs.Collections.RESOURCE_ATTACHMENTS,
        id: attachmentId,
        overrideAccess: false,
        req,
        user,
      })
    }

    if (transactionID) await payload.db.commitTransaction(transactionID)
  } catch (error) {
    if (transactionID) await payload.db.rollbackTransaction(transactionID)

    payload.logger.error({ err: error }, "deleteResourceAndAttachments failed")
    // Payload's NotFound says only "Not Found", and may be for the resource or a file.
    if (error instanceof APIError && error.status === 404) {
      return {
        formError: "This resource or one of its files no longer exists. Reload the page.",
        ok: false,
      }
    }
    // A hook's or access rule's refusal is already fit to show.
    if (error instanceof APIError) return { formError: error.message, ok: false }
    return { formError: FALLBACK_ERROR, ok: false }
  }

  // The resource is deleted. A cache failure must not make the admin delete it again.
  try {
    updateTag(QueryKeys.RESOURCES.ROOT)
    updateTag(QueryKeys.RESOURCES.ID(resourceId))
  } catch (error) {
    payload.logger.error({ err: error }, "deleteResourceAndAttachments could not update the cache")
  }

  return { ok: true }
}
