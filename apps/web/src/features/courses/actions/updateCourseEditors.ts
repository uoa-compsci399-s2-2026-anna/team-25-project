"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/features/auth/actions/types"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { requireMember, resultFromWriteError } from "./courseForm"

const inputSchema = z.object({
  courseId: z.number().int().positive(),
  editorIds: z
    .array(z.number().int().positive())
    .max(50)
    .refine((ids) => new Set(ids).size === ids.length),
  ownerId: z.number().int().positive().optional(),
})

const FALLBACK_ERROR = "Could not save the editors. Try again."

/**
 * Replaces a course's editors, and with `ownerId` hands the course to one of them -
 * the old owner then stays on as an editor. The write runs as the member, so the
 * course hooks refuse anyone but the owner, and a new owner who is not an editor.
 */
export const updateCourseEditors = async (input: unknown): Promise<ActionResult> => {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { formError: FALLBACK_ERROR, ok: false }

  const member = await requireMember({
    notMember: "Only members can manage editors - admins manage the directory, not entries in it.",
    signedOut: "Sign in to manage editors.",
  })
  if (member.error) return member.error
  const { user } = member

  const { courseId, editorIds, ownerId = user.id } = parsed.data
  const payload = await getPayloadClient()

  try {
    await payload.update({
      collection: Slugs.Collections.COURSES,
      id: courseId,
      // The current owner stays an editor after a transfer. The course hooks drop the
      // new owner from the list.
      data: {
        ...(ownerId !== user.id && { owner: ownerId }),
        editors: [...editorIds, user.id],
      },
      overrideAccess: false,
      user,
    })
  } catch (error) {
    const result = resultFromWriteError(error, FALLBACK_ERROR)
    if (result) return result
    payload.logger.error({ err: error }, "updateCourseEditors failed")
    return { formError: FALLBACK_ERROR, ok: false }
  }

  updateTag(QueryKeys.COURSES.ROOT)
  updateTag(QueryKeys.COURSES.ID(courseId))

  return { ok: true }
}
