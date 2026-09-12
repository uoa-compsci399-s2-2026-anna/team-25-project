import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Institution } from "@repo/shared/payload-types"
import { cacheLife, cacheTag } from "next/cache"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

export type InstitutionOption = { value: Institution["id"]; label: string }

export const getInstitutionOptions = async (): Promise<InstitutionOption[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.INSTITUTIONS,
    pagination: false,
    select: { name: true },
    sort: "name",
  })
  return docs.map(({ id, name }) => ({ label: name, value: id }))
}

export const getInstitutionOptionsCached = async () => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.INSTITUTIONS)
  return getInstitutionOptions()
}
