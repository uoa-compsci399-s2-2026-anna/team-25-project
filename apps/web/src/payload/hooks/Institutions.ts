import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Institution } from "@repo/shared/payload-types"
import { revalidateTag } from "next/cache"
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload"

// Cached proposals carry each author's institution and filter on it, so they go stale too.
const revalidate = () => {
  revalidateTag(QueryKeys.INSTITUTIONS, "max")
  revalidateTag(QueryKeys.PROPOSALS.ROOT, "max")
}

export const revalidateInstitutions: CollectionAfterChangeHook<Institution> = ({ doc, req }) => {
  if (!req.context.disableRevalidate) revalidate()
  return doc
}

export const revalidateDeletedInstitution: CollectionAfterDeleteHook<Institution> = ({
  doc,
  req,
}) => {
  if (!req.context.disableRevalidate) revalidate()
  return doc
}
