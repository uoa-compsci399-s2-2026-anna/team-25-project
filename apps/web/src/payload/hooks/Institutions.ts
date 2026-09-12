import { revalidateTag } from "next/cache"
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload"

// getInstitutions caches its result under this tag; without invalidating it,
// an institution added or edited here would not show up in the registration
// dropdown until the cache next expires on its own. "default" matches the
// cacheLife profile getInstitutions gets by not calling cacheLife() itself.
const revalidateInstitutions = () => revalidateTag("institutions", "default")

export const revalidateInstitutionsAfterChange: CollectionAfterChangeHook = ({ doc }) => {
  revalidateInstitutions()
  return doc
}

export const revalidateInstitutionsAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateInstitutions()
  return doc
}
