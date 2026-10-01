import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Resource } from "@repo/shared/payload-types"
import { revalidateTag } from "next/cache"
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, FieldHook } from "payload"
import { Slugs } from "@/lib/payload/slugs"

const revalidateResource = (resourceId: number) => {
  revalidateTag(QueryKeys.RESOURCES.ROOT, "max")
  revalidateTag(QueryKeys.RESOURCES.ID(resourceId), "max")
}

export const revalidateResources: CollectionAfterChangeHook<Resource> = ({ doc, req }) => {
  if (!req.context.disableRevalidate) revalidateResource(doc.id)
  return doc
}

export const revalidateDeletedResource: CollectionAfterDeleteHook<Resource> = ({ doc, req }) => {
  if (!req.context.disableRevalidate) revalidateResource(doc.id)
  return doc
}

/**
 * Makes the member creating a resource its owner, ignoring any owner they sent.
 * Admins keep the ability to set one directly, since they are not members and
 * cannot own anything.
 */
export const defaultResourceOwner: FieldHook = ({ value, req, operation }) => {
  if (operation !== "create") return value
  if (req.user?.collection !== Slugs.Collections.MEMBERS) return value
  return req.user.id
}
