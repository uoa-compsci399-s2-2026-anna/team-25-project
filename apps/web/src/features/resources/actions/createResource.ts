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

const FAILED = "Could not share this resource. Try again."

/**
 * Uploads the attachments and creates the resource that links them in one transaction, so a
 * failed resource never leaves attachment rows behind. Files Payload has already written to
 * storage aren't removed by the rollback, as storage sits outside the database.
 */
export const createResource = async (formData: FormData): Promise<ActionResult> => {
  const parsed = parseResourceForm(formData)
  if (!parsed.ok) {
    return { fieldErrors: parsed.fieldErrors, ok: false }
  }

  const attachments = newAttachments(formData)
  const attachmentsError = resourceAttachmentsError(attachments)
  if (attachmentsError) {
    return { fieldErrors: { attachments: attachmentsError }, ok: false }
  }

  const { collection, user } = await getCurrentUser()
  if (!user) {
    return { formError: "Sign in to share a resource.", ok: false }
  }
  // Admins can reach the page but own nothing, as on courses, so they get their own message
  // rather than one implying they aren't signed in.
  if (collection !== Slugs.Collections.MEMBERS) {
    return {
      formError: "Only members can share a resource - admins manage resources, not share them.",
      ok: false,
    }
  }

  const payload = await getPayloadClient()
  const transactionID = await payload.db.beginTransaction()
  const req = transactionID ? { transactionID } : undefined

  try {
    const uploaded = await uploadAttachments(payload, attachments, { req, user })
    if (!uploaded.ok) {
      if (transactionID) await payload.db.rollbackTransaction(transactionID)
      return { fieldErrors: { attachments: uploaded.error }, ok: false }
    }

    await payload.create({
      collection: Slugs.Collections.RESOURCES,
      data: {
        attachments: uploaded.ids,
        course: parsed.data.course,
        description: parsed.data.description,
        // Required by the type; defaultResourceOwner sets it to the signed-in member anyway.
        owner: user.id,
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
      return resultFromValidationError(error, FAILED)
    }
    payload.logger.error({ err: error }, "createResource failed")
    return { formError: FAILED, ok: false }
  }

  updateTag(QueryKeys.RESOURCES.ROOT)

  return { ok: true }
}
