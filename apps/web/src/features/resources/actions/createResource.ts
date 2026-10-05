"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { addResourceFormSchema, resourceAttachmentsError } from "@repo/shared/schemas/resources"
import { updateTag } from "next/cache"
import { ValidationError } from "payload"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

type ZodIssue = { message: string; path: PropertyKey[] }

const fieldErrorsFromIssues = (issues: readonly ZodIssue[]): Record<string, string> => {
  const fieldErrors: Record<string, string> = {}
  for (const issue of issues) {
    const field = issue.path.join(".")
    // Only the first message per field is shown, matching one message per input.
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }
  return fieldErrors
}

const resultFromValidationError = (
  error: ValidationError,
  fallbackFormError: string,
): ActionResult => {
  const fieldErrors: Record<string, string> = {}
  for (const { path, message } of error.data?.errors ?? []) {
    if (path && !fieldErrors[path]) {
      fieldErrors[path] = message
    }
  }
  return Object.keys(fieldErrors).length > 0
    ? { fieldErrors, ok: false }
    : { formError: fallbackFormError, ok: false }
}

// The rich-text description can't travel as a plain FormData value, so the form sends it as
// JSON. Anything unreadable becomes undefined and fails the schema as a missing description.
const parseJson = (value: FormDataEntryValue | null): unknown => {
  if (typeof value !== "string") return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

// "" is "no course"; the schema refuses anything else that isn't a positive whole number.
const parseCourse = (value: FormDataEntryValue | null) =>
  typeof value === "string" && value !== "" ? Number(value) : null

const FAILED = "Could not share this resource. Try again."

/**
 * Uploads the attachments and creates the resource that links them in one transaction, so a
 * failed resource never leaves attachment rows behind. Files Payload has already written to
 * storage aren't removed by the rollback, as storage sits outside the database.
 */
export const createResource = async (formData: FormData): Promise<ActionResult> => {
  const parsed = addResourceFormSchema.safeParse({
    course: parseCourse(formData.get("course")),
    description: parseJson(formData.get("description")),
    title: formData.get("title") ?? "",
  })
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const attachments = formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0)
  const attachmentsError = resourceAttachmentsError(attachments)
  if (attachmentsError) {
    return { fieldErrors: { attachments: attachmentsError }, ok: false }
  }

  const { collection, user } = await getCurrentUser()
  if (!user || collection !== Slugs.Collections.MEMBERS) {
    return { formError: "Sign in as a member to share a resource.", ok: false }
  }

  const payload = await getPayloadClient()
  const transactionID = await payload.db.beginTransaction()
  const req = transactionID ? { transactionID } : undefined

  try {
    const attachmentIds: number[] = []
    for (const file of attachments) {
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
        attachmentIds.push(attachment.id)
      } catch (error) {
        // Payload checks each file's contents (e.g. a PDF that isn't really one), and its
        // message names no file, so the field error says which one it was.
        if (error instanceof ValidationError) {
          const message = error.data?.errors?.[0]?.message ?? "This file could not be uploaded."
          if (transactionID) await payload.db.rollbackTransaction(transactionID)
          return { fieldErrors: { attachments: `${file.name}: ${message}` }, ok: false }
        }
        throw error
      }
    }

    await payload.create({
      collection: Slugs.Collections.RESOURCES,
      data: {
        attachments: attachmentIds,
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
