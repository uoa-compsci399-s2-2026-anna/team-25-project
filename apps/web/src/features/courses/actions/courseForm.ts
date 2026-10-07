import type { Member } from "@repo/shared/payload-types"
import type { AddCourseFormInput } from "@repo/shared/schemas/courses"
import { richTextHasText } from "@repo/shared/schemas/shared"
import { APIError, ValidationError } from "payload"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"

// Shared by the course dialog's actions (createCourse, updateDraftCourse). Kept
// out of those "use server" files, which may only export async actions.

type ZodIssue = { message: string; path: PropertyKey[] }

export const fieldErrorsFromIssues = (issues: readonly ZodIssue[]): Record<string, string> => {
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

/**
 * Maps a failed course write to what the dialog shows, or `undefined` for an
 * unexpected error the caller should log before falling back to `fallbackFormError`.
 */
export const resultFromWriteError = (
  error: unknown,
  fallbackFormError: string,
): ActionResult | undefined => {
  if (error instanceof ValidationError) {
    return resultFromValidationError(error, fallbackFormError)
  }
  // The collection hooks (e.g. requiring publication content, a valid
  // period) throw a plain APIError rather than a ValidationError, so there
  // is no field path to attach - its message is already fit to show as-is.
  if (error instanceof APIError) {
    return { formError: error.message, ok: false }
  }
  return undefined
}

/**
 * The signed-in member, or the dialog's error for anyone else. The courses page
 * itself requires sign-in (#90), so `!user` stays as a fallback for a direct
 * call to an action outside that page, not a case the UI here needs to design
 * around. An admin can reach the page too but has no institution of their own
 * to own a course in, so admins get their own message rather than one implying
 * they aren't signed in at all.
 */
export const requireMember = async (messages: {
  signedOut: string
  notMember: string
}): Promise<{ error: ActionResult } | { error?: undefined; user: Member }> => {
  const { collection, user } = await getCurrentUser()
  if (!user) return { error: { formError: messages.signedOut, ok: false } }
  if (collection !== Slugs.Collections.MEMBERS) {
    return { error: { formError: messages.notMember, ok: false } }
  }
  return { user }
}

/**
 * The offering fields of a submitted form, as Payload takes them. The dialog
 * always sends every field, blank ones included, but Payload's date columns
 * reject an empty string outright - so each blank field becomes `blank` instead:
 * `undefined` on a create, where it's simply left unset, or `null` on an update,
 * which keeps any key it isn't sent and so needs `null` to actually clear one.
 *
 * Rich text counts as blank with no visible text in it - an editor the user
 * typed in and then cleared still holds an empty paragraph.
 */
export const toVersionData = <Blank extends null | undefined>(
  input: AddCourseFormInput,
  blank: Blank,
) => {
  const text = (value: string | undefined) => (value ? value : blank)
  const richText = <Value extends { root: unknown }>(value: Value | null | undefined) =>
    value && richTextHasText(value.root) ? value : blank

  return {
    additionalInfo: richText(input.additionalInfo),
    assessments: richText(input.assessments),
    deliveryFormat: input.deliveryFormat ? input.deliveryFormat : blank,
    endDate: text(input.endDate),
    learningOutcomes: richText(input.learningOutcomes),
    name: input.name,
    period: text(input.period),
    programme: text(input.programme),
    projectType: text(input.projectType),
    startDate: text(input.startDate),
  }
}
