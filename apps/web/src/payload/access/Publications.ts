import type { Access } from "payload"
import { Slugs } from "@/lib/payload/slugs"

/**
 * Admins reach every publication and  members are constrained to the ones that
 * link them as an author.
 *
 * Only ever use this for update and delete. The returned constraint filters an
 * existing row, so on create there is nothing to filter and Payload would treat
 * the truthy object as a plain "allowed" - letting anyone through.
 */
export const isAdminOrLinkedAuthor: Access = ({ req }) => {
  if (!req.user) return false
  if (req.user.collection === Slugs.Collections.ADMIN) return true
  return { "authors.member": { equals: req.user.id } }
}
