"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { registerDetailsSchema } from "@repo/shared/schemas/register"
import { updateTag } from "next/cache"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

// Same rules as registration - title must be one of MemberTitle (or null).
const nameSchema = registerDetailsSchema.pick({ title: true, firstName: true, lastName: true })

// The member comes from the session, never the client, so only your own name can change.
export const updateMemberName = async (input: unknown): Promise<ActionResult> => {
  const parsed = nameSchema.safeParse(input)
  if (!parsed.success) {
    return {
      formError: parsed.error.issues[0]?.message ?? "Check your name and title.",
      ok: false,
    }
  }

  const { collection, user } = await getCurrentUser()
  if (!user || collection !== Slugs.Collections.MEMBERS) {
    return { formError: "Sign in as a member to edit your name.", ok: false }
  }

  const payload = await getPayloadClient()

  try {
    await payload.update({
      collection: Slugs.Collections.MEMBERS,
      id: user.id,
      data: parsed.data,
      user,
      overrideAccess: false,
    })
  } catch (error) {
    payload.logger.error({ err: error }, "updateMemberName failed")
    return { formError: "Could not save your name. Try again.", ok: false }
  }

  updateTag(QueryKeys.MEMBERS.ID(user.id))

  return { ok: true }
}
