import type { Access } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { admin } from "./helpers"

// Set by deleteResourceAndAttachments, the one way an admin deletes a resource.
export const RESOURCE_DELETE = "resourceDelete"

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

/**
 * Admins delete a resource only through deleteResourceAndAttachments, which takes its
 * files with it. Without the flag the admin panel hides its own Delete, which would
 * leave the files behind. Members keep deleting their own, as on update.
 */
export const resourceDelete: Access = (args) =>
  admin(args.req) ? args.req.context[RESOURCE_DELETE] === true : isAdminOrOwner(args)
