import { QueryKeys } from "@repo/shared/constants/query-keys"
import { revalidateTag } from "next/cache"
import type { GlobalAfterChangeHook } from "payload"

export const revalidateCommunityGuidelines: GlobalAfterChangeHook = ({ doc, req }) => {
  if (!req.context.disableRevalidate) revalidateTag(QueryKeys.COMMUNITY_GUIDELINES, "max")
  return doc
}
