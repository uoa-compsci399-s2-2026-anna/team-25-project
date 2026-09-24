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

export type InstitutionName = Pick<Institution, "id" | "name">

// Only the name is read, so the result is the pair the page renders rather than
// a partly-empty `Institution`.
export const getInstitutionName = async (
  institutionId: number,
): Promise<InstitutionName | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.INSTITUTIONS,
    where: { id: { equals: institutionId } },
    depth: 0,
    limit: 1,
    pagination: false,
    select: { name: true },
  })
  return docs[0] ?? null
}

export const getInstitution = async (institutionId: number): Promise<Institution | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.INSTITUTIONS,
    where: { id: { equals: institutionId } },
    depth: 0,
    limit: 1,
    pagination: false,
  })
  return docs[0] ?? null
}

export const getInstitutionOptionsCached = async () => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.INSTITUTIONS)
  return getInstitutionOptions()
}

export const getInstitutionNameCached = async (institutionId: number) => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.INSTITUTIONS)
  return getInstitutionName(institutionId)
}

export const getInstitutionCached = async (institutionId: number) => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.INSTITUTIONS)
  return getInstitution(institutionId)
}
