import type { Access } from "payload"
import { Slugs } from "@/lib/payload/slugs"

/**
 * Admins reach every resource; members are constrained to the ones they own.
 *
 * Only ever use this for update and delete. The returned constraint filters an
 * existing row, so on create there is nothing to filter and Payload would treat
 * the truthy object as a plain "allowed" — letting anyone through.
 */
export const isAdminOrOwner: Access = ({ req }) => {
  if (!req.user) return false
  if (req.user.collection === Slugs.Collections.ADMIN) return true
  return { owner: { equals: req.user.id } }
}
