"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/features/auth/actions/types"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { ownerIdOf } from "../courses.format"
import { requireMember, withCourseTransaction } from "./courseForm"

const inputSchema = z.object({ courseId: z.number().int().positive() })

const FALLBACK_ERROR = "Could not delete this draft. Try again."

/**
 * Deletes a never-published course the member owns, plus its draft offerings.
 * Offerings go first (the hooks refuse a course that has any), all in one transaction.
 */
export const deleteDraftCourse = async (input: unknown): Promise<ActionResult> => {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { formError: FALLBACK_ERROR, ok: false }

  const member = await requireMember({
    notMember: "Only members can delete a draft - admins manage the directory, not entries in it.",
    signedOut: "Sign in to delete a draft.",
  })
  if (member.error) return member.error
  const { user } = member

  const { courseId } = parsed.data
  const payload = await getPayloadClient()
  const result = await withCourseTransaction(
    payload,
    "deleteDraftCourse",
    FALLBACK_ERROR,
    async (req) => {
      const course = await payload.findByID({
        collection: Slugs.Collections.COURSES,
        id: courseId,
        depth: 0,
        overrideAccess: false,
        req,
        user,
      })
      // The hooks check these too; this just gives draft-specific messages.
      if (course.hasPublishedVersion) {
        return {
          formError: "This course has already been published, so it can't be deleted.",
          ok: false,
        }
      }
      if (ownerIdOf(course) !== user.id) {
        return { formError: "Only the course's owner can delete this draft.", ok: false }
      }

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
          id: offering.id,
          overrideAccess: false,
          req,
          user,
        })
      }

      await payload.delete({
        collection: Slugs.Collections.COURSES,
        id: courseId,
        overrideAccess: false,
        req,
        user,
      })
    },
  )
  if (!result.ok) return result

  updateTag(QueryKeys.COURSES.ROOT)

  return { ok: true }
}
