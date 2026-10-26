import type { Admin, Member } from "@repo/shared/payload-types"
import { addResourceFormSchema } from "@repo/shared/schemas/resources"
import { type Payload, ValidationError } from "payload"
import type { ActionResult } from "@/features/auth/actions/types"
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

export const resultFromValidationError = (
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

/** The title, description and course the resource form sent, or the field errors to show. */
export const parseResourceForm = (formData: FormData) => {
  const parsed = addResourceFormSchema.safeParse({
    course: parseCourse(formData.get("course")),
    description: parseJson(formData.get("description")),
    title: formData.get("title") ?? "",
  })
  return parsed.success
    ? { data: parsed.data, ok: true as const }
    : { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false as const }
}

/** The new files the resource form sent. */
export const newAttachments = (formData: FormData) =>
  formData.getAll("attachments").filter((value): value is File => value instanceof File)

/**
 * Uploads each file as a resource attachment, inside the caller's transaction. A file Payload
 * refuses comes back as a field error naming it; anything else is thrown for the caller.
 */
export const uploadAttachments = async (
  payload: Payload,
  files: readonly File[],
  { req, user }: { req: { transactionID: number | string } | undefined; user: Admin | Member },
): Promise<{ ids: number[]; ok: true } | { error: string; ok: false }> => {
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
        return { error: `${file.name}: ${message}`, ok: false }
      }
      throw error
    }
  }
  return { ids, ok: true }
}
