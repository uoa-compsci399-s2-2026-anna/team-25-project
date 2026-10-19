"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/features/auth/actions/types"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { requireMember, withCourseTransaction } from "./courseForm"

const inputSchema = z.object({
  courseId: z.number().int().positive(),
  offeringId: z.number().int().positive(),
})

const FALLBACK_ERROR = "Could not delete this draft. Try again."

/**
 * Deletes a draft offering from Manage offerings. Any owner or editor of the
 * course may, unlike a whole draft course, which only its owner can delete. A
 * published offering can't be: the hooks refuse it, as its history is permanent.
 */
export const deleteOffering = async (input: unknown): Promise<ActionResult> => {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { formError: FALLBACK_ERROR, ok: false }

  const member = await requireMember({
    notMember: "Only members can delete a draft - admins can use the admin panel.",
    signedOut: "Sign in to delete a draft.",
  })
  if (member.error) return member.error
  const { user } = member

  const { courseId, offeringId } = parsed.data
  const payload = await getPayloadClient()
  const result = await withCourseTransaction(
    payload,
    "deleteOffering",
    FALLBACK_ERROR,
    async (req) => {
      const offering = await payload.findByID({
        collection: Slugs.Collections.COURSE_VERSIONS,
        id: offeringId,
        depth: 0,
        overrideAccess: false,
        req,
        user,
      })
      if (offering.course !== courseId) return { formError: FALLBACK_ERROR, ok: false }
      // The hooks check this too; this just gives a message for a draft-only button.
      if (offering._status === "published") {
        return { formError: "This offering has been published, so it can't be deleted.", ok: false }
      }

      await payload.delete({
        collection: Slugs.Collections.COURSE_VERSIONS,
        id: offeringId,
        overrideAccess: false,
        req,
        user,
      })
    },
  )
  if (!result.ok) return result

  updateTag(QueryKeys.COURSES.ROOT)
  updateTag(QueryKeys.COURSES.ID(courseId))

  return { ok: true }
}
