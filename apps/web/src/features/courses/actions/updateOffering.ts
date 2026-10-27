"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { correctOfferingFormSchema } from "@repo/shared/schemas/courses"
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
  parseTeachingTeam,
  requireMember,
  resultFromWriteError,
  teachingTeamPublishError,
  toVersionData,
} from "./courseForm"

const offeringIdsSchema = z.object({
  courseId: z.number().int().positive(),
  offeringId: z.number().int().positive(),
})

const FALLBACK_ERROR = "Could not save this offering. Try again."

/**
 * Corrects a published offering. The change goes live at once. It takes the teaching
 * team the dialog sends, or else keeps the stored one, less any member deleted since.
 *
 * The write runs as the member, so the course hooks still decide whether they may
 * edit this course, and refuse a correction that changes nothing.
 */
export const updateOffering = async (input: unknown): Promise<ActionResult> => {
  const ids = offeringIdsSchema.safeParse(input)
  if (!ids.success) return { formError: FALLBACK_ERROR, ok: false }

  // A correction is held to the same rules as publishing a new offering.
  const parsed = correctOfferingFormSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const team = parseTeachingTeam(input)
  if (team.error) return team.error

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
    // `draft: true` reads the newest version, so a draft saved over the published
    // offering (e.g. in the admin) shows up here rather than being published unseen.
    const offering = await payload.findByID({
      collection: Slugs.Collections.COURSE_VERSIONS,
      id: offeringId,
      depth: 0,
      draft: true,
      overrideAccess: false,
      user,
    })
    if (relationID(offering.course) !== courseId) return { formError: FALLBACK_ERROR, ok: false }
    if (offering._status !== "published") {
      return {
        formError: "This offering has unpublished draft changes, so it can't be edited here.",
        ok: false,
      }
    }

    const teachingTeam = team.teachingTeam ?? liveTeachingTeam(offering.teachingTeam)
    const teamError = teachingTeamPublishError(teachingTeam)
    if (teamError) return teamError

    await payload.update({
      collection: Slugs.Collections.COURSE_VERSIONS,
      id: offeringId,
      data: {
        // `null`, not `undefined`, for a blank field: see `toVersionData`.
        ...toVersionData(parsed.data, null),
        teachingTeam,
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
