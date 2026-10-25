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
  liveTeachingTeam,
  requireMember,
  resultFromWriteError,
  toVersionData,
} from "./courseForm"

const offeringIdsSchema = z.object({
  courseId: z.number().int().positive(),
  sourceId: z.number().int().positive(),
})

const FALLBACK_ERROR = "Could not add this offering. Try again."

/**
 * Adds a new offering of an existing course, copied from `sourceId` (the offering
 * the dialog was filled in from), either published or saved as a draft. The dialog
 * has no member picker, so the new offering keeps the source's teaching team - a
 * draft holds it too, ready for when it's published.
 *
 * The write runs as the member, so the course hooks still decide whether they may
 * edit this course, and still check the offering is complete enough to publish.
 */
export const createOffering = async (input: unknown): Promise<ActionResult> => {
  const ids = offeringIdsSchema.safeParse(input)
  if (!ids.success) return { formError: FALLBACK_ERROR, ok: false }

  const parsed = addOfferingFormSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const member = await requireMember({
    notMember: "Only members can add an offering - admins manage the directory, not entries in it.",
    signedOut: "Sign in to add an offering.",
  })
  if (member.error) return member.error
  const { user } = member

  const { courseId, sourceId } = ids.data
  const payload = await getPayloadClient()

  try {
    const source = await payload.findByID({
      collection: Slugs.Collections.COURSE_VERSIONS,
      id: sourceId,
      depth: 0,
      overrideAccess: false,
      user,
    })
    if (relationID(source.course) !== courseId) return { formError: FALLBACK_ERROR, ok: false }

    const offeringData = {
      ...toVersionData(parsed.data, undefined),
      course: courseId,
      teachingTeam: liveTeachingTeam(source.teachingTeam),
    }

    // Separate calls so `draft` stays a literal - see createCourse.
    if (parsed.data.intent === "publish") {
      await payload.create({
        collection: Slugs.Collections.COURSE_VERSIONS,
        data: {
          ...offeringData,
          // Sent explicitly for prepareVersion to treat this as a publish - see createCourse.
          _status: "published",
        } as RequiredDataFromCollectionSlug<"courseVersions">,
        draft: false,
        overrideAccess: false,
        user,
      })
    } else {
      await payload.create({
        collection: Slugs.Collections.COURSE_VERSIONS,
        data: offeringData,
        draft: true,
        overrideAccess: false,
        user,
      })
    }
  } catch (error) {
    const result = resultFromWriteError(error, FALLBACK_ERROR)
    if (result) return result
    payload.logger.error({ err: error }, "createOffering failed")
    return { formError: FALLBACK_ERROR, ok: false }
  }

  updateTag(QueryKeys.COURSES.ROOT)
  updateTag(QueryKeys.COURSES.ID(courseId))

  return { ok: true }
}
