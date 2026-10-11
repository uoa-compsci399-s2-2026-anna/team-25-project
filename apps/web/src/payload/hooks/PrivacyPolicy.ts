import { QueryKeys } from "@repo/shared/constants/query-keys"
import { revalidateTag } from "next/cache"
import type { GlobalAfterChangeHook } from "payload"

export const revalidatePrivacyPolicy: GlobalAfterChangeHook = ({ doc, req }) => {
  if (!req.context.disableRevalidate) revalidateTag(QueryKeys.PRIVACY_POLICY, "max")
  return doc
}
