import type { CourseVersion, Member } from "@repo/shared/payload-types"
import { type AddCourseFormInput, teachingTeamInputSchema } from "@repo/shared/schemas/courses"
import { richTextHasText } from "@repo/shared/schemas/shared"
import { APIError, ValidationError } from "payload"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { relationID } from "@/payload/access/Courses/helpers"

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

// Payload refuses a member who no longer exists. The dialogs have no input for these
// lists, so the error goes on the form.
const memberListFields = new Set(["editors", "teachingTeam"])
const MISSING_MEMBER_ERROR = "A chosen member no longer exists. Remove them and try again."

const resultFromValidationError = (
  error: ValidationError,
  fallbackFormError: string,
): ActionResult => {
  const fieldErrors: Record<string, string> = {}
  let formError: string | undefined
  for (const { path, message } of error.data?.errors ?? []) {
    if (path && memberListFields.has(path.split(".")[0] ?? "")) {
      formError = MISSING_MEMBER_ERROR
    } else if (path && !fieldErrors[path]) {
      fieldErrors[path] = message
    }
  }
  if (formError) return { fieldErrors, formError, ok: false }
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
    // Payload's NotFound, e.g. a draft deleted in another tab. Its own message is
    // just "Not Found".
    if (error.status === 404) {
      return { formError: "This course or offering no longer exists. Reload the page.", ok: false }
    }
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
  input: Omit<AddCourseFormInput, "code" | "intent" | "role">,
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

/**
 * An offering's teaching team without the rows whose member was deleted. Those rows
 * would block publishing. Used when the dialog sends no team, so teaching staff never
 * see these rows.
 */
export const liveTeachingTeam = (rows: CourseVersion["teachingTeam"]) =>
  (rows ?? []).flatMap(({ member, role }) => {
    const memberId = relationID(member)
    return memberId ? [{ member: memberId, role }] : []
  })

/**
 * The teaching team the dialog sent, or undefined when it sent none - it sends one
 * only when the team was changed there, so otherwise the offering keeps its own.
 */
export const parseTeachingTeam = (input: unknown) => {
  const parsed = teachingTeamInputSchema.safeParse(input)
  if (parsed.success) return { teachingTeam: parsed.data.teachingTeam }
  const formError = parsed.error.issues[0]?.message ?? "Check the teaching team and try again."
  return { error: { formError, ok: false } satisfies ActionResult }
}

/**
 * Why the team cannot be published, or undefined when it can. The course hooks check
 * this too, but their message points at no field.
 */
export const teachingTeamPublishError = (
  team: { role?: string | null }[],
): ActionResult | undefined => {
  if (!team.length)
    return { formError: "Add at least one teaching team member to publish.", ok: false }
  if (team.some((row) => !row.role?.trim()))
    return {
      fieldErrors: { teachingTeam: "Give each teaching team member a role to publish." },
      ok: false,
    }
}
