import { QueryKeys } from "@repo/shared/constants/query-keys"
import { cacheLife, cacheTag } from "next/cache"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

export const getPrivacyPolicy = async () => {
  const payload = await getPayloadClient()
  const privacyPolicy = await payload.findGlobal({
    slug: Slugs.Globals.PRIVACY_POLICY,
  })
  return privacyPolicy
}

export const getPrivacyPolicyCached = async () => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.PRIVACY_POLICY)
  return getPrivacyPolicy()
}
