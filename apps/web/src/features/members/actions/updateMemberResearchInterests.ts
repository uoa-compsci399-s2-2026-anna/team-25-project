"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { RESEARCH_INTEREST_MAX_LENGTH, RESEARCH_INTERESTS_MAX } from "@repo/shared/schemas/register"
import { updateTag } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

// Same limits as registration and the Members collection. Blanks and repeats are
// dropped before the count is checked, so "AI, , AI" is one interest, not three.
const interestsSchema = z
  .array(
    z
      .string()
      .trim()
      .max(
        RESEARCH_INTEREST_MAX_LENGTH,
        `Keep each interest under ${RESEARCH_INTEREST_MAX_LENGTH} characters`,
      ),
  )
  .transform((interests) => [...new Set(interests.filter(Boolean))])
  .pipe(
    z
      .array(z.string())
      .max(RESEARCH_INTERESTS_MAX, `Add up to ${RESEARCH_INTERESTS_MAX} research interests`),
  )

// The member comes from the session, never the client, so only your own interests can change.
export const updateMemberResearchInterests = async (input: unknown): Promise<ActionResult> => {
  const parsed = interestsSchema.safeParse(input)
  if (!parsed.success) {
    return {
      formError: parsed.error.issues[0]?.message ?? "Research interests must be a list of text.",
      ok: false,
    }
  }

  const { collection, user } = await getCurrentUser()
  if (!user || collection !== Slugs.Collections.MEMBERS) {
    return { formError: "Sign in as a member to edit your research interests.", ok: false }
  }

  const payload = await getPayloadClient()

  try {
    await payload.update({
      collection: Slugs.Collections.MEMBERS,
      id: user.id,
      data: { researchInterests: parsed.data },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    payload.logger.error({ err: error }, "updateMemberResearchInterests failed")
    return { formError: "Could not save your research interests. Try again.", ok: false }
  }

  updateTag(QueryKeys.MEMBERS.ID(user.id))

  return { ok: true }
}
