"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/features/auth/actions/types"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { relationID } from "@/payload/access/Courses/helpers"
import { requireMember, resultFromWriteError } from "./courseForm"

const inputSchema = z.object({
  courseId: z.number().int().positive(),
  offeringId: z.number().int().positive(),
})

const FALLBACK_ERROR = "Could not delete this draft. Try again."

/**
 * Deletes a draft offering. Any of the course's editors may, since it only removes
 * an offering nobody else has seen; the hooks refuse a published one.
 */
export const deleteDraftOffering = async (input: unknown): Promise<ActionResult> => {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { formError: FALLBACK_ERROR, ok: false }

  const member = await requireMember({
    notMember: "Only members can delete a draft - admins manage the directory, not entries in it.",
    signedOut: "Sign in to delete a draft.",
  })
  if (member.error) return member.error
  const { user } = member

  const { courseId, offeringId } = parsed.data
  const payload = await getPayloadClient()

  try {
    const offering = await payload.findByID({
      collection: Slugs.Collections.COURSE_VERSIONS,
      id: offeringId,
      depth: 0,
      overrideAccess: false,
      user,
    })
    if (relationID(offering.course) !== courseId) return { formError: FALLBACK_ERROR, ok: false }
    // The hooks check this too; this just gives a draft-specific message.
    if (offering._status === "published") {
      return {
        formError: "This offering has already been published, so it can't be deleted.",
        ok: false,
      }
    }

    await payload.delete({
      collection: Slugs.Collections.COURSE_VERSIONS,
      id: offeringId,
      overrideAccess: false,
      user,
    })
  } catch (error) {
    const result = resultFromWriteError(error, FALLBACK_ERROR)
    if (result) return result
    payload.logger.error({ err: error }, "deleteDraftOffering failed")
    return { formError: FALLBACK_ERROR, ok: false }
  }

  updateTag(QueryKeys.COURSES.ID(courseId))

  return { ok: true }
}
