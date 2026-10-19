"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { offeringFormSchema } from "@repo/shared/schemas/courses"
import { updateTag } from "next/cache"
import type { PayloadRequest, RequiredDataFromCollectionSlug } from "payload"
import { z } from "zod"
import type { ActionResult } from "@/features/auth/actions/types"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import {
  fieldErrorsFromIssues,
  requireMember,
  teachingTeamData,
  toVersionData,
  withCourseTransaction,
} from "./courseForm"

const idsSchema = z.object({
  courseId: z.number().int().positive(),
  /** The offering "Start from" copied, whose teaching team the new one keeps. */
  startFromId: z.number().int().positive().nullable(),
})

const FALLBACK_ERROR = "Could not add this offering. Try again."

/**
 * Adds an offering to an existing course, from Manage offerings. The dialog copies
 * the "Start from" offering's content itself; its teaching team is read here
 * instead, so the client never decides who teaches an offering. Without one, a
 * publish makes the signed-in member its sole teaching-team member, as
 * `createCourse` does.
 *
 * Runs as the member, so the course hooks decide whether they may edit the course,
 * and refuse a term and year the course already has an offering for.
 */
export const createOffering = async (input: unknown): Promise<ActionResult> => {
  const ids = idsSchema.safeParse(input)
  if (!ids.success) return { formError: FALLBACK_ERROR, ok: false }

  const parsed = offeringFormSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const member = await requireMember({
    notMember: "Only members can add an offering - admins can use the admin panel.",
    signedOut: "Sign in to add an offering.",
  })
  if (member.error) return member.error
  const { user } = member

  const { courseId, startFromId } = ids.data
  const { intent, role } = parsed.data
  const publishing = intent === "publish"
  const payload = await getPayloadClient()

  // The same revision Manage offerings copied the content from: a published
  // offering's publication, or a draft's newest revision. Its teaching team then
  // matches the one the dialog decided whether to ask for a role by.
  const readStartFrom = async (id: number, req: Partial<PayloadRequest> | undefined) => {
    const read = (draft: boolean) =>
      payload.findByID({
        collection: Slugs.Collections.COURSE_VERSIONS,
        id,
        depth: 0,
        draft,
        overrideAccess: false,
        req,
        user,
      })
    const row = await read(false)
    return row._status === "published" ? row : read(true)
  }

  const result = await withCourseTransaction(
    payload,
    "createOffering",
    FALLBACK_ERROR,
    async (req) => {
      let teachingTeam: ReturnType<typeof teachingTeamData> = []
      if (startFromId) {
        const source = await readStartFrom(startFromId, req)
        if (source.course !== courseId) return { formError: FALLBACK_ERROR, ok: false }
        teachingTeam = teachingTeamData(source.teachingTeam)
      }

      if (teachingTeam.length === 0 && publishing) {
        if (!role) return { fieldErrors: { role: "Your role is required to publish" }, ok: false }
        teachingTeam = [{ member: user.id, role }]
      }

      const versionData = {
        ...toVersionData(parsed.data, undefined),
        course: courseId,
        ...(teachingTeam.length > 0 && { teachingTeam }),
      }

      // Separate calls for the same reason as in `createCourse`: `draft` has to stay
      // a literal, and publishing has to send `_status` for prepareVersion to see it.
      if (publishing) {
        await payload.create({
          collection: Slugs.Collections.COURSE_VERSIONS,
          data: {
            ...versionData,
            _status: "published",
          } as RequiredDataFromCollectionSlug<"courseVersions">,
          draft: false,
          overrideAccess: false,
          req,
          user,
        })
      } else {
        await payload.create({
          collection: Slugs.Collections.COURSE_VERSIONS,
          data: versionData,
          draft: true,
          overrideAccess: false,
          req,
          user,
        })
      }
    },
  )
  if (!result.ok) return result

  updateTag(QueryKeys.COURSES.ROOT)
  updateTag(QueryKeys.COURSES.ID(courseId))

  return { ok: true }
}
