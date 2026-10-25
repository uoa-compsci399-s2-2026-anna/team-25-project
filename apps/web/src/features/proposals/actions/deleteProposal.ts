"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

const DELETE_FAILED = "Could not delete this proposal. Try again."

/**
 * Deletes a proposal. The id comes from the browser, so it isn't trusted: with
 * overrideAccess: false, Payload's isAdminOrAuthors rule refuses anyone but the
 * proposal's own authors and admins - the same rule that already gates editing it.
 */
export const deleteProposal = async (id: number): Promise<ActionResult> => {
  const { user } = await getCurrentUser()
  if (!user) {
    return { formError: "Sign in to delete this proposal.", ok: false }
  }
  if (!Number.isInteger(id)) {
    return { formError: DELETE_FAILED, ok: false }
  }

  const payload = await getPayloadClient()

  try {
    await payload.delete({
      collection: Slugs.Collections.PROPOSALS,
      id,
      user,
      overrideAccess: false,
    })
  } catch (error) {
    // Forbidden and NotFound too - one message, so it doesn't reveal whether the proposal exists.
    payload.logger.error({ err: error }, "deleteProposal failed")
    return { formError: DELETE_FAILED, ok: false }
  }

  updateTag(QueryKeys.PROPOSALS.ROOT)

  return { ok: true }
}
