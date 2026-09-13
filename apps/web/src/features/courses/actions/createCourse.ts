"use server"

import { addCourseFormSchema } from "@repo/shared/schemas/courses"
import { APIError, type RequiredDataFromCollectionSlug, ValidationError } from "payload"
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

// The dialog always sends every field, blank ones included - Payload's date
// columns reject an empty string outright, so a blank optional field must
// reach `create()` as `undefined`, never `""`.
const blankToUndefined = (value: string | undefined) => (value ? value : undefined)

// Both textareas are plain text, so wrap each line as a Lexical paragraph.
const toLexicalRichText = (plainText: string) => ({
  root: {
    type: "root",
    children: plainText.split("\n").map((line) => ({
      type: "paragraph",
      children: line ? [{ type: "text", version: 1, text: line }] : [],
      direction: "ltr" as const,
      format: "" as const,
      indent: 0,
      version: 1,
    })),
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    version: 1,
  },
})

/**
 * Creates the course and its first offering together. The two writes share
 * one database transaction so a failed offering never leaves a course behind
 * with nothing to show for it - `beginTransaction` can return `null` on an
 * adapter without transaction support, in which case each write simply gets
 * its own.
 *
 * Publishing has no member picker to build a real teaching team from, so it
 * publishes with the signed-in creator as the offering's sole teaching-team
 * member - any signed-in member can publish their own course this way, not
 * only ones with some special "teaching team" role.
 */
export const createCourse = async (input: unknown): Promise<ActionResult> => {
  const parsed = addCourseFormSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const { collection, user } = await getCurrentUser()
  // The courses page itself requires sign-in (#90), so this should only ever
  // be reached signed in - `!user` stays as a fallback for a direct call to
  // this action outside that page, not a case the UI here needs to design
  // around. An admin can reach the page too but has no institution of their
  // own to own a course in, so admins get their own message rather than one
  // implying they aren't signed in at all.
  if (!user) {
    return { formError: "Sign in to add a course.", ok: false }
  }
  if (collection !== Slugs.Collections.MEMBERS) {
    return {
      formError: "Only members can add a course - admins manage the directory, not entries in it.",
      ok: false,
    }
  }

  const payload = await getPayloadClient()
  const {
    assessments,
    code,
    deliveryFormat,
    endDate,
    intent,
    learningOutcomes,
    name,
    period,
    programme,
    projectType,
    role,
    startDate,
  } = parsed.data
  const publishing = intent === "publish"

  const transactionID = await payload.db.beginTransaction()
  const req = transactionID ? { transactionID } : undefined

  try {
    const course = await payload.create({
      collection: Slugs.Collections.COURSES,
      // institution/owner are required by the type, but prepareCourse's
      // assignMemberOwner hook fills both in for a member-created course
      // before Payload validates this data.
      data: { code } as RequiredDataFromCollectionSlug<"courses">,
      draft: false,
      overrideAccess: false,
      req,
      user,
    })

    const versionData = {
      assessments: assessments ? toLexicalRichText(assessments) : undefined,
      course: course.id,
      deliveryFormat: deliveryFormat ? deliveryFormat : undefined,
      endDate: blankToUndefined(endDate),
      learningOutcomes: learningOutcomes ? toLexicalRichText(learningOutcomes) : undefined,
      name,
      period: blankToUndefined(period),
      programme: blankToUndefined(programme),
      projectType: blankToUndefined(projectType),
      startDate: blankToUndefined(startDate),
    }

    // A draft's fields are all optional by the collection's own type, but
    // publishing needs the full shape - kept as separate calls so `draft`
    // stays a literal Payload can use to pick the matching one.
    if (publishing) {
      await payload.create({
        collection: Slugs.Collections.COURSE_VERSIONS,
        data: {
          ...versionData,
          // `draft: false` alone only tells Payload's own versioning system
          // not to save a draft - the collection's own prepareVersion hook
          // decides whether *this* write counts as a publish (running the
          // hooks that stamp publishedAt/displaySnapshot and flip the
          // course's hasPublishedVersion) by reading `data._status`, so that
          // has to be sent explicitly too. Matches the seed script's own
          // published-offering writes.
          _status: "published",
          teachingTeam: [{ member: user.id, role }],
        } as RequiredDataFromCollectionSlug<"courseVersions">,
        draft: false,
        overrideAccess: false,
        req,
        user,
      })
    } else {
      await payload.create({
        collection: Slugs.Collections.COURSE_VERSIONS,
        data: versionData,
        draft: true,
        overrideAccess: false,
        req,
        user,
      })
    }

    if (transactionID) await payload.db.commitTransaction(transactionID)
  } catch (error) {
    if (transactionID) await payload.db.rollbackTransaction(transactionID)

    if (error instanceof ValidationError) {
      return resultFromValidationError(error, "Could not add this course. Try again.")
    }
    // The collection hooks (e.g. requiring publication content, a valid
    // period) throw a plain APIError rather than a ValidationError, so there
    // is no field path to attach - its message is already fit to show as-is.
    if (error instanceof APIError) {
      return { formError: error.message, ok: false }
    }
    payload.logger.error({ err: error }, "createCourse failed")
    return { formError: "Could not add this course. Try again.", ok: false }
  }

  return { ok: true }
}
