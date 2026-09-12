import { revalidateTag } from "next/cache"
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload"

// Matches getInstitutionsCached's tag and its implicit "default" cacheLife
// profile, so an edited institution doesn't wait out the cache on its own.
const revalidateInstitutions = () => revalidateTag("institutions", "default")

export const revalidateInstitutionsAfterChange: CollectionAfterChangeHook = ({ doc, req }) => {
  if (!req.context.disableRevalidate) revalidateInstitutions()
  return doc
}

export const revalidateInstitutionsAfterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (!req.context.disableRevalidate) revalidateInstitutions()
  return doc
}
