"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { CourseVersion } from "@repo/shared/payload-types"
import { addCourseFormSchema } from "@repo/shared/schemas/courses"
import { updateTag } from "next/cache"
import type { RequiredDataFromCollectionSlug } from "payload"
import { z } from "zod"
import type { ActionResult } from "@/features/auth/actions/types"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import {
  fieldErrorsFromIssues,
  requireMember,
  resultFromWriteError,
  toVersionData,
} from "./courseForm"

const draftIdsSchema = z.object({
  courseId: z.number().int().positive(),
  versionId: z.number().int().positive(),
})

const FALLBACK_ERROR = "Could not save this course. Try again."

/**
 * Saves the add-course dialog over an existing, never-published course and its
 * draft offering - reopening a draft from the courses table - instead of creating
 * a new one. Publishing from here publishes that same offering, with the signed-in
 * member as its sole teaching-team member, just like `createCourse` does.
 *
 * Both writes run as the member, so Payload's access rules and the course hooks
 * still decide whether they may edit it; the hooks also refuse an offering that
 * doesn't belong to `courseId`. One transaction covers both, so a code change is
 * never kept when the offering fails to save.
 */
export const updateDraftCourse = async (input: unknown): Promise<ActionResult> => {
  const ids = draftIdsSchema.safeParse(input)
  if (!ids.success) return { formError: FALLBACK_ERROR, ok: false }

  const parsed = addCourseFormSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const member = await requireMember({
    notMember: "Only members can edit a course - admins manage the directory, not entries in it.",
    signedOut: "Sign in to edit a course.",
  })
  if (member.error) return member.error
  const { user } = member

  const { courseId, versionId } = ids.data
  const { code, intent, role } = parsed.data
  const publishing = intent === "publish"

  const payload = await getPayloadClient()
  const transactionID = await payload.db.beginTransaction()
  const req = transactionID ? { transactionID } : undefined

  try {
    const course = await payload.findByID({
      collection: Slugs.Collections.COURSES,
      id: courseId,
      depth: 0,
      overrideAccess: false,
      req,
      user,
    })
    // The table only offers never-published courses for editing, but a second tab
    // may have published this one since - after which it's a correction, which
    // this dialog has no change summary for.
    if (course.hasPublishedVersion) {
      if (transactionID) await payload.db.rollbackTransaction(transactionID)
      return { formError: "This course has already been published.", ok: false }
    }

    // prepareCourse trims and upper-cases the code, and refuses a code change once
    // the course is published - not a concern for a course reaching this point.
    if (code !== course.code) {
      await payload.update({
        collection: Slugs.Collections.COURSES,
        id: courseId,
        data: { code },
        overrideAccess: false,
        req,
        user,
      })
    }

    // `null`, not `undefined`, for a blank field: see `toVersionData`.
    const versionData = { ...toVersionData(parsed.data, null), course: courseId }

    // Separate calls for the same reason as in `createCourse`: `draft` has to stay
    // a literal, and publishing has to send `_status` for prepareVersion to see it.
    if (publishing) {
      await payload.update({
        collection: Slugs.Collections.COURSE_VERSIONS,
        id: versionId,
        data: {
          ...versionData,
          _status: "published",
          teachingTeam: [{ member: user.id, role }],
        } as RequiredDataFromCollectionSlug<"courseVersions">,
        draft: false,
        overrideAccess: false,
        req,
        user,
      })
    } else {
      await payload.update({
        collection: Slugs.Collections.COURSE_VERSIONS,
        id: versionId,
        // Payload types period and the dates as required, which holds for the
        // collection row but not a draft revision - those may still be blank.
        data: versionData as Partial<CourseVersion>,
        draft: true,
        overrideAccess: false,
        req,
        user,
      })
    }

    if (transactionID) await payload.db.commitTransaction(transactionID)
  } catch (error) {
    if (transactionID) await payload.db.rollbackTransaction(transactionID)

    const result = resultFromWriteError(error, FALLBACK_ERROR)
    if (result) return result
    payload.logger.error({ err: error }, "updateDraftCourse failed")
    return { formError: FALLBACK_ERROR, ok: false }
  }

  updateTag(QueryKeys.COURSES.ROOT)

  return { ok: true }
}
