"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { addOfferingFormSchema } from "@repo/shared/schemas/courses"
import { updateTag } from "next/cache"
import type { RequiredDataFromCollectionSlug } from "payload"
import { z } from "zod"
import type { ActionResult } from "@/features/auth/actions/types"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { relationID } from "@/payload/access/Courses/helpers"
import {
  fieldErrorsFromIssues,
  requireMember,
  resultFromWriteError,
  toVersionData,
} from "./courseForm"

const offeringIdsSchema = z.object({
  courseId: z.number().int().positive(),
  offeringId: z.number().int().positive(),
})

const FALLBACK_ERROR = "Could not save this offering. Try again."

/**
 * Corrects a published offering. The change goes live at once, and the offering
 * keeps its teaching team since the dialog doesn't send one.
 *
 * The write runs as the member, so the course hooks still decide whether they may
 * edit this course, and refuse a correction that changes nothing.
 */
export const updateOffering = async (input: unknown): Promise<ActionResult> => {
  const ids = offeringIdsSchema.safeParse(input)
  if (!ids.success) return { formError: FALLBACK_ERROR, ok: false }

  // A correction is held to the same rules as publishing a new offering.
  const parsed = addOfferingFormSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const member = await requireMember({
    notMember:
      "Only members can edit an offering - admins manage the directory, not entries in it.",
    signedOut: "Sign in to edit an offering.",
  })
  if (member.error) return member.error
  const { user } = member

  const { courseId, offeringId } = ids.data
  const payload = await getPayloadClient()

  try {
    const offering = await payload.findByID({
      collection: Slugs.Collections.COURSE_VERSIONS,
      id: offeringId,
      depth: 0,
      overrideAccess: false,
      user,
    })
    // Only published offerings have an Edit button, and saving here publishes, so a
    // draft reaching this point would go live by accident.
    if (relationID(offering.course) !== courseId || offering._status !== "published") {
      return { formError: FALLBACK_ERROR, ok: false }
    }

    await payload.update({
      collection: Slugs.Collections.COURSE_VERSIONS,
      id: offeringId,
      data: {
        // `null`, not `undefined`, for a blank field: see `toVersionData`.
        ...toVersionData(parsed.data, null),
        // Sent explicitly for prepareVersion to treat this as a publish - see createCourse.
        _status: "published",
      } as RequiredDataFromCollectionSlug<"courseVersions">,
      draft: false,
      overrideAccess: false,
      user,
    })
  } catch (error) {
    const result = resultFromWriteError(error, FALLBACK_ERROR)
    if (result) return result
    payload.logger.error({ err: error }, "updateOffering failed")
    return { formError: FALLBACK_ERROR, ok: false }
  }

  updateTag(QueryKeys.COURSES.ROOT)
  updateTag(QueryKeys.COURSES.ID(courseId))

  return { ok: true }
}
