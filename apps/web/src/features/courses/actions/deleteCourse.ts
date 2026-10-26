"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { COURSE_DELETE } from "@/payload/hooks/helpers"
import { resultFromWriteError } from "./courseForm"

const inputSchema = z.object({ courseId: z.number().int().positive() })

const FALLBACK_ERROR = "Could not delete this course. Try again."

/**
 * Deletes a course and every offering it has, published history included. Admin-only:
 * members can't delete a course once it's published (its history is permanent to them),
 * and drafts have their own action (deleteDraftCourse).
 *
 * Offerings go first, as the hooks refuse a course that still has any, all in one
 * transaction. COURSE_DELETE is what lets assertVersionDeletable pass the published ones.
 * Resources linked to the course are kept, and just lose the link.
 */
export const deleteCourse = async (input: unknown): Promise<ActionResult> => {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { formError: FALLBACK_ERROR, ok: false }

  const { collection, user } = await getCurrentUser()
  if (!user) return { formError: "Sign in to delete a course.", ok: false }
  if (collection !== Slugs.Collections.ADMIN) {
    return { formError: "Only an admin can delete a course.", ok: false }
  }

  const { courseId } = parsed.data
  const payload = await getPayloadClient()
  const transactionID = await payload.db.beginTransaction()
  const req = transactionID ? { transactionID } : undefined
  const context = { [COURSE_DELETE]: courseId }

  try {
    const { docs: offerings } = await payload.find({
      collection: Slugs.Collections.COURSE_VERSIONS,
      where: { course: { equals: courseId } },
      depth: 0,
      overrideAccess: false,
      pagination: false,
      req,
      user,
    })
    for (const offering of offerings) {
      await payload.delete({
        collection: Slugs.Collections.COURSE_VERSIONS,
        context,
        id: offering.id,
        overrideAccess: false,
        req,
        user,
      })
    }

    await payload.delete({
      collection: Slugs.Collections.COURSES,
      context,
      id: courseId,
      overrideAccess: false,
      req,
      user,
    })

    if (transactionID) await payload.db.commitTransaction(transactionID)
  } catch (error) {
    if (transactionID) await payload.db.rollbackTransaction(transactionID)

    const result = resultFromWriteError(error, FALLBACK_ERROR)
    if (result) return result
    payload.logger.error({ err: error }, "deleteCourse failed")
    return { formError: FALLBACK_ERROR, ok: false }
  }

  // The course is deleted. A cache failure must not make the admin delete it again.
  try {
    updateTag(QueryKeys.COURSES.ROOT)
    updateTag(QueryKeys.COURSES.ID(courseId))
  } catch (error) {
    payload.logger.error({ err: error }, "deleteCourse could not update the cache")
  }

  return { ok: true }
}
