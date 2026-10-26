"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

const DELETE_FAILED = "Could not delete this resource. Try again."

/**
 * Deletes a resource. The id comes from the browser, so it isn't trusted: with
 * overrideAccess: false, Payload's isAdminOrOwner rule refuses anyone but the
 * resource's owner and admins. Its attachments stay, as members can't delete
 * attachment rows (see ResourceAttachments).
 */
export const deleteResource = async (id: number): Promise<ActionResult> => {
  if (!Number.isInteger(id)) {
    return { formError: DELETE_FAILED, ok: false }
  }

  const { user } = await getCurrentUser()
  if (!user) {
    return { formError: "Sign in to delete this resource.", ok: false }
  }

  const payload = await getPayloadClient()

  try {
    await payload.delete({
      collection: Slugs.Collections.RESOURCES,
      id,
      overrideAccess: false,
      user,
    })
  } catch (error) {
    // Forbidden and NotFound too - one message, so it doesn't reveal whether the resource exists.
    payload.logger.error({ err: error, userId: user.id }, "deleteResource failed")
    return { formError: DELETE_FAILED, ok: false }
  }

  // The resource is deleted. A cache failure must not make the user delete it again.
  // The root tag covers every list it was on: the resources page, its course and its owner's profile.
  try {
    updateTag(QueryKeys.RESOURCES.ROOT)
    updateTag(QueryKeys.RESOURCES.ID(id))
  } catch (error) {
    payload.logger.error({ err: error }, "deleteResource could not update the cache")
  }

  return { ok: true }
}
