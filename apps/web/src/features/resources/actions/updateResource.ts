"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { resourceAttachmentsError } from "@repo/shared/schemas/resources"
import { updateTag } from "next/cache"
import { ValidationError } from "payload"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import {
  newAttachments,
  parseResourceForm,
  resultFromValidationError,
  uploadAttachments,
} from "../resource-form-data"

const UPDATE_FAILED = "Could not save this resource. Try again."

/**
 * Saves an edit to a resource. The form sends the ids of the attachments to keep and any new
 * files: the new ones are uploaded and linked in one transaction with the update, as on create.
 * A file left out is only unlinked - members can't delete attachment rows (see
 * ResourceAttachments), so it stays in storage for an admin to clear.
 *
 * The id comes from the browser, so it isn't trusted: with overrideAccess: false, Payload's
 * isAdminOrOwner rule refuses anyone but the owner and admins.
 */
export const updateResource = async (id: number, formData: FormData): Promise<ActionResult> => {
  if (!Number.isInteger(id)) {
    return { formError: UPDATE_FAILED, ok: false }
  }

  const parsed = parseResourceForm(formData)
  if (!parsed.ok) {
    return { fieldErrors: parsed.fieldErrors, ok: false }
  }

  const { collection, user } = await getCurrentUser()
  if (!user) {
    return { formError: "Sign in to edit this resource.", ok: false }
  }

  const payload = await getPayloadClient()
  const existing = await payload.findByID({
    collection: Slugs.Collections.RESOURCES,
    id,
    depth: 1,
    disableErrors: true,
    overrideAccess: false,
    populate: { [Slugs.Collections.RESOURCE_ATTACHMENTS]: { filesize: true } },
    select: { attachments: true, owner: true },
    user,
  })
  const ownerId = typeof existing?.owner === "object" ? existing.owner.id : existing?.owner
  // Checked before uploading anything, so a member who can't save never writes files to
  // storage. Payload's own rule still decides the update below.
  if (!existing || (collection === Slugs.Collections.MEMBERS && ownerId !== user.id)) {
    return { formError: UPDATE_FAILED, ok: false }
  }

  // Only ids this resource already links can be kept, so the form can't link someone else's file.
  const keepIds = new Set(formData.getAll("keepAttachments").map(Number))
  const kept = (existing.attachments ?? []).flatMap((attachment) => {
    const attachmentId = typeof attachment === "object" ? attachment.id : attachment
    if (!keepIds.has(attachmentId)) return []
    return [
      { id: attachmentId, size: typeof attachment === "object" ? (attachment.filesize ?? 0) : 0 },
    ]
  })

  const attachments = newAttachments(formData)
  const attachmentsError = resourceAttachmentsError(attachments, kept)
  if (attachmentsError) {
    return { fieldErrors: { attachments: attachmentsError }, ok: false }
  }

  const transactionID = await payload.db.beginTransaction()
  const req = transactionID ? { transactionID } : undefined

  try {
    const uploaded = await uploadAttachments(payload, attachments, { req, user })
    if (!uploaded.ok) {
      if (transactionID) await payload.db.rollbackTransaction(transactionID)
      return { fieldErrors: { attachments: uploaded.error }, ok: false }
    }

    await payload.update({
      collection: Slugs.Collections.RESOURCES,
      id,
      data: {
        attachments: [...kept.map((attachment) => attachment.id), ...uploaded.ids],
        course: parsed.data.course,
        description: parsed.data.description,
        title: parsed.data.title,
      },
      overrideAccess: false,
      req,
      user,
    })

    if (transactionID) await payload.db.commitTransaction(transactionID)
  } catch (error) {
    if (transactionID) await payload.db.rollbackTransaction(transactionID)

    if (error instanceof ValidationError) {
      return resultFromValidationError(error, UPDATE_FAILED)
    }
    // Forbidden and NotFound too - one message, so it doesn't reveal whether the resource exists.
    payload.logger.error({ err: error, userId: user.id }, "updateResource failed")
    return { formError: UPDATE_FAILED, ok: false }
  }

  // The resource is saved. A cache failure must not make the user save it again.
  try {
    updateTag(QueryKeys.RESOURCES.ROOT)
    updateTag(QueryKeys.RESOURCES.ID(id))
  } catch (error) {
    payload.logger.error({ err: error }, "updateResource could not update the cache")
  }

  return { ok: true }
}
