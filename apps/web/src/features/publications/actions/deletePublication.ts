"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

const DELETE_FAILED = "Could not delete this publication. Try again."

/**
 * Deletes a publication. The id comes from the browser, so it isn't trusted: with
 * overrideAccess: false, Payload's isAdminOrLinkedAuthor rule refuses anyone but
 * the publication's linked authors and admins.
 */
export const deletePublication = async (id: number): Promise<ActionResult> => {
  if (!Number.isInteger(id)) {
    return { formError: DELETE_FAILED, ok: false }
  }

  const { user } = await getCurrentUser()
  if (!user) {
    return { formError: "Sign in to delete this publication.", ok: false }
  }

  const payload = await getPayloadClient()

  try {
    await payload.delete({
      collection: Slugs.Collections.PUBLICATIONS,
      id,
      overrideAccess: false,
      user,
    })
  } catch (error) {
    // Forbidden and NotFound too - one message, so it doesn't reveal whether the publication exists.
    payload.logger.error({ err: error, userId: user.id }, "deletePublication failed")
    return { formError: DELETE_FAILED, ok: false }
  }

  updateTag(QueryKeys.PUBLICATIONS.ROOT)

  return { ok: true }
}
