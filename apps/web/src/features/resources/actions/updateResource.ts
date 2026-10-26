"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Admin, Member } from "@repo/shared/payload-types"
import { updateResourceSchema } from "@repo/shared/schemas/resources"
import { updateTag } from "next/cache"
import { type Payload, type PayloadRequest, ValidationError } from "payload"
import type { ActionResult } from "@/features/auth/actions/types"
import { fieldErrorsFromIssues, resultFromValidationError } from "@/lib/actions/validationErrors"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { uploadAttachments } from "./uploadAttachments"

const SAVE_FAILED = "Could not save your changes. Try again."

// The editor only shows formError, so a field's message is repeated there.
const withFormError = (result: ActionResult): ActionResult =>
  result.ok || result.formError
    ? result
    : { ...result, formError: Object.values(result.fieldErrors ?? {})[0] ?? SAVE_FAILED }

/** The ids of the files linked to the resource now, read as `user`. */
const linkedAttachmentIds = async (
  payload: Payload,
  id: number,
  { req, user }: { req: Partial<PayloadRequest> | undefined; user: Admin | Member },
) => {
  const resource = await payload.findByID({
    collection: Slugs.Collections.RESOURCES,
    id,
    depth: 0,
    overrideAccess: false,
    req,
    user,
  })
  return new Set(
    (resource.attachments ?? []).map((attachment) =>
      typeof attachment === "object" ? attachment.id : attachment,
    ),
  )
}

/**
 * Saves an in-place edit. The id comes from the browser, so it isn't trusted: with
 * overrideAccess: false, Payload's isAdminOrOwner rule refuses anyone else.
 */
export const updateResource = async (id: number, input: unknown): Promise<ActionResult> => {
  const { user } = await getCurrentUser()
  if (!user) {
    return { formError: "Sign in to edit this resource.", ok: false }
  }
  if (!Number.isInteger(id)) {
    return { formError: SAVE_FAILED, ok: false }
  }

  const parsed = updateResourceSchema.safeParse(input)
  if (!parsed.success) {
    return withFormError({ fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false })
  }

  const payload = await getPayloadClient()
  const { attachments, ...fields } = parsed.data
  // Only an attachments edit uploads, so only it needs a transaction: a failed save then
  // leaves no new attachment rows behind (files already in storage stay, as on create).
  const transactionID = attachments ? await payload.db.beginTransaction() : undefined
  const req = transactionID ? { transactionID } : undefined

  try {
    let data: typeof fields & { attachments?: number[] } = fields
    if (attachments) {
      const linked = await linkedAttachmentIds(payload, id, { req, user })
      const uploaded = await uploadAttachments(payload, attachments.add, { req, user })
      if ("fieldError" in uploaded) {
        if (transactionID) await payload.db.rollbackTransaction(transactionID)
        return withFormError({ fieldErrors: { attachments: uploaded.fieldError }, ok: false })
      }
      // Only ids already on this resource are kept, so another resource's file can't be
      // linked here by its id.
      const kept = [...new Set(attachments.keep)].filter((keptId) => linked.has(keptId))
      data = { ...fields, attachments: [...kept, ...uploaded.ids] }
    }

    await payload.update({
      collection: Slugs.Collections.RESOURCES,
      id,
      data,
      req,
      user,
      overrideAccess: false,
    })
    if (transactionID) await payload.db.commitTransaction(transactionID)
  } catch (error) {
    if (transactionID) await payload.db.rollbackTransaction(transactionID)
    if (error instanceof ValidationError) {
      return withFormError(resultFromValidationError(error, SAVE_FAILED))
    }
    // Forbidden and NotFound too - one message, so it doesn't reveal whether the resource exists.
    payload.logger.error({ err: error }, "updateResource failed")
    return { formError: SAVE_FAILED, ok: false }
  }

  // The afterChange hook only marks these stale, so the editor would see the old text once more.
  updateTag(QueryKeys.RESOURCES.ID(id))
  updateTag(QueryKeys.RESOURCES.ROOT)

  return { ok: true }
}
