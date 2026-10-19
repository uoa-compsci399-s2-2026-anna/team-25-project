"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { CourseVersion } from "@repo/shared/payload-types"
import { offeringFormSchema } from "@repo/shared/schemas/courses"
import { updateTag } from "next/cache"
import type { RequiredDataFromCollectionSlug } from "payload"
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
  offeringId: z.number().int().positive(),
})

const FALLBACK_ERROR = "Could not save this offering. Try again."

/**
 * Saves one offering from Manage offerings. What that means depends on it:
 *
 * - A draft is saved as a draft or published, like reopening a draft course. One
 *   with no teaching team yet publishes with the signed-in member as its only member.
 * - A published offering is corrected: the whole form is published straight away,
 *   with a "What changed?" summary. It never goes back to being a draft, and its
 *   teaching team is left as published. The hooks also refuse a correction that
 *   changes nothing, or reuses the last one's summary.
 *
 * Runs as the member in one transaction, so the course hooks still decide whether
 * they may edit it.
 */
export const updateOffering = async (input: unknown): Promise<ActionResult> => {
  const ids = idsSchema.safeParse(input)
  if (!ids.success) return { formError: FALLBACK_ERROR, ok: false }

  const parsed = offeringFormSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const member = await requireMember({
    notMember: "Only members can edit an offering - admins can use the admin panel.",
    signedOut: "Sign in to edit an offering.",
  })
  if (member.error) return member.error
  const { user } = member

  const { courseId, offeringId } = ids.data
  const { changeSummary, intent, role } = parsed.data
  const publishing = intent === "publish"

  const payload = await getPayloadClient()
  const result = await withCourseTransaction(
    payload,
    "updateOffering",
    FALLBACK_ERROR,
    async (req): Promise<ActionResult | undefined> => {
      // The collection row holds the offering's publication while it has one, so its
      // status is whether this is a correction.
      const saved = await payload.findByID({
        collection: Slugs.Collections.COURSE_VERSIONS,
        id: offeringId,
        depth: 0,
        overrideAccess: false,
        req,
        user,
      })
      if (saved.course !== courseId) return { formError: FALLBACK_ERROR, ok: false }

      // `null`, not `undefined`, for a blank field: see `toVersionData`.
      const versionData = { ...toVersionData(parsed.data, null), course: courseId }

      if (saved._status === "published") {
        // The dialog offers no draft save here, but a second tab may have published
        // the draft it opened since.
        if (!publishing) {
          return {
            formError: "This offering has been published, so changes go live straight away.",
            ok: false,
          }
        }
        if (!changeSummary) {
          return {
            fieldErrors: { changeSummary: "Say what changed to publish a correction" },
            ok: false,
          }
        }

        await payload.update({
          collection: Slugs.Collections.COURSE_VERSIONS,
          id: offeringId,
          data: { ...versionData, _status: "published", changeSummary } as Partial<CourseVersion>,
          draft: false,
          overrideAccess: false,
          req,
          user,
        })
      } else if (publishing) {
        // A draft revision is newer than the row, so its team is the one last saved.
        const draft = await payload.findByID({
          collection: Slugs.Collections.COURSE_VERSIONS,
          id: offeringId,
          depth: 0,
          draft: true,
          overrideAccess: false,
          req,
          user,
        })
        let teachingTeam = teachingTeamData(draft.teachingTeam)
        if (teachingTeam.length === 0) {
          if (!role) {
            return {
              fieldErrors: { role: "Your role is required to publish" },
              ok: false,
            }
          }
          teachingTeam = [{ member: user.id, role }]
        }

        await payload.update({
          collection: Slugs.Collections.COURSE_VERSIONS,
          id: offeringId,
          data: {
            ...versionData,
            _status: "published",
            teachingTeam,
          } as RequiredDataFromCollectionSlug<"courseVersions">,
          draft: false,
          overrideAccess: false,
          req,
          user,
        })
      } else {
        await payload.update({
          collection: Slugs.Collections.COURSE_VERSIONS,
          id: offeringId,
          // Payload types the dates as required, which holds for the
          // collection row but not a draft revision - those may still be blank.
          data: versionData as Partial<CourseVersion>,
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
