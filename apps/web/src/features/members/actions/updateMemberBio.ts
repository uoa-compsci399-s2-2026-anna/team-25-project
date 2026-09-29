"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

const bioSchema = z.string().trim()

// The member comes from the session, never the client, so only your own bio can change.
export const updateMemberBio = async (input: unknown): Promise<ActionResult> => {
  const parsed = bioSchema.safeParse(input)
  if (!parsed.success) {
    return { formError: "Bio must be text.", ok: false }
  }

  const { collection, user } = await getCurrentUser()
  if (!user || collection !== Slugs.Collections.MEMBERS) {
    return { formError: "Sign in as a member to edit your bio.", ok: false }
  }

  const payload = await getPayloadClient()

  try {
    await payload.update({
      collection: Slugs.Collections.MEMBERS,
      id: user.id,
      data: { bio: parsed.data },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    payload.logger.error({ err: error }, "updateMemberBio failed")
    return { formError: "Could not save your bio. Try again.", ok: false }
  }

  updateTag(QueryKeys.MEMBERS.ID(user.id))

  return { ok: true }
}
