"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { registerDetailsSchema } from "@repo/shared/schemas/register"
import { updateTag } from "next/cache"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

// Same rule as registration, so a position can't be valid in one place and not the other.
const positionSchema = registerDetailsSchema.shape.position

// The member comes from the session, never the client, so only your own position can change.
export const updateMemberPosition = async (input: unknown): Promise<ActionResult> => {
  const parsed = positionSchema.safeParse(input)
  if (!parsed.success) {
    return { formError: parsed.error.issues[0]?.message ?? "Position must be text.", ok: false }
  }

  const { collection, user } = await getCurrentUser()
  if (!user || collection !== Slugs.Collections.MEMBERS) {
    return { formError: "Sign in as a member to edit your position.", ok: false }
  }

  const payload = await getPayloadClient()

  try {
    await payload.update({
      collection: Slugs.Collections.MEMBERS,
      id: user.id,
      data: { position: parsed.data },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    payload.logger.error({ err: error }, "updateMemberPosition failed")
    return { formError: "Could not save your position. Try again.", ok: false }
  }

  updateTag(QueryKeys.MEMBERS.ID(user.id))

  return { ok: true }
}
