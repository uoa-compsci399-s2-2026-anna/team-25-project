"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { CourseVersion } from "@repo/shared/payload-types"
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

const FALLBACK_ERROR = "Could not save this draft. Try again."

/**
 * Saves the dialog over a draft offering, or publishes it. The draft already holds
 * the teaching team it was copied with, so publishing keeps that.
 *
 * The write runs as the member, so the course hooks still decide whether they may
 * edit this course, and still check the offering is complete enough to publish.
 */
export const updateDraftOffering = async (input: unknown): Promise<ActionResult> => {
  const ids = offeringIdsSchema.safeParse(input)
  if (!ids.success) return { formError: FALLBACK_ERROR, ok: false }

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
    // Without `draft`, this reads the collection row, whose status only becomes
    // "published" once the offering is.
    const offering = await payload.findByID({
      collection: Slugs.Collections.COURSE_VERSIONS,
      id: offeringId,
      depth: 0,
      overrideAccess: false,
      user,
    })
    if (relationID(offering.course) !== courseId) return { formError: FALLBACK_ERROR, ok: false }
    // A second tab may have published it since. Saving a draft over a published
    // offering would leave a pending edit nobody can see, so that's refused.
    if (offering._status === "published") {
      return { formError: "This offering has already been published.", ok: false }
    }

    // `null`, not `undefined`, for a blank field: see `toVersionData`.
    const versionData = toVersionData(parsed.data, null)

    // Separate calls so `draft` stays a literal - see createCourse.
    if (parsed.data.intent === "publish") {
      await payload.update({
        collection: Slugs.Collections.COURSE_VERSIONS,
        id: offeringId,
        data: {
          ...versionData,
          // Sent explicitly for prepareVersion to treat this as a publish - see createCourse.
          _status: "published",
        } as RequiredDataFromCollectionSlug<"courseVersions">,
        draft: false,
        overrideAccess: false,
        user,
      })
    } else {
      await payload.update({
        collection: Slugs.Collections.COURSE_VERSIONS,
        id: offeringId,
        // A draft may still have no period or dates - see updateDraftCourse.
        data: versionData as Partial<CourseVersion>,
        draft: true,
        overrideAccess: false,
        user,
      })
    }
  } catch (error) {
    const result = resultFromWriteError(error, FALLBACK_ERROR)
    if (result) return result
    payload.logger.error({ err: error }, "updateDraftOffering failed")
    return { formError: FALLBACK_ERROR, ok: false }
  }

  updateTag(QueryKeys.COURSES.ROOT)
  updateTag(QueryKeys.COURSES.ID(courseId))

  return { ok: true }
}
