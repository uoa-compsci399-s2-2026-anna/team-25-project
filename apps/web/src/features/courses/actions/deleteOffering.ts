"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/features/auth/actions/types"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { relationID } from "@/payload/access/Courses/helpers"
import { ownerIdOf } from "../courses.format"
import { requireMember, resultFromWriteError } from "./courseForm"

const inputSchema = z.object({
  courseId: z.number().int().positive(),
  offeringId: z.number().int().positive(),
})

const FALLBACK_ERROR = "Could not delete this offering. Try again."

/**
 * Deletes a published offering. Only the course's owner may, and never the course's last
 * published offering - deleting a course stays with admins (see deleteCourse). The hooks
 * enforce both (assertVersionDeletable); this just checks the owner first for a clear message.
 */
export const deleteOffering = async (input: unknown): Promise<ActionResult> => {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { formError: FALLBACK_ERROR, ok: false }

  const member = await requireMember({
    notMember: "Only the course's owner can delete an offering.",
    signedOut: "Sign in to delete an offering.",
  })
  if (member.error) return member.error
  const { user } = member

  const { courseId, offeringId } = parsed.data
  const payload = await getPayloadClient()

  try {
    const [course, offering] = await Promise.all([
      payload.findByID({
        collection: Slugs.Collections.COURSES,
        id: courseId,
        depth: 0,
        overrideAccess: false,
        user,
      }),
      payload.findByID({
        collection: Slugs.Collections.COURSE_VERSIONS,
        id: offeringId,
        depth: 0,
        overrideAccess: false,
        user,
      }),
    ])
    if (relationID(offering.course) !== courseId) return { formError: FALLBACK_ERROR, ok: false }
    if (ownerIdOf(course) !== user.id) {
      return { formError: "Only the course's owner can delete an offering.", ok: false }
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
    payload.logger.error({ err: error }, "deleteOffering failed")
    return { formError: FALLBACK_ERROR, ok: false }
  }

  // The offering is deleted. A cache failure must not make the owner delete it again.
  try {
    updateTag(QueryKeys.COURSES.ROOT)
    updateTag(QueryKeys.COURSES.ID(courseId))
  } catch (error) {
    payload.logger.error({ err: error }, "deleteOffering could not update the cache")
  }

  return { ok: true }
}
