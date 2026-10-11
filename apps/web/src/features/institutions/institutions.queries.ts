import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Institution, Media } from "@repo/shared/payload-types"
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

export const getActiveInstitutionOptions = async (): Promise<InstitutionOption[]> => {
  const payload = await getPayloadClient()
  const { values } = await payload.findDistinct({
    collection: Slugs.Collections.MEMBERS,
    field: "institution",
    depth: 1,
    populate: { [Slugs.Collections.INSTITUTIONS]: { name: true } },
  })
  return values
    .map(({ institution }) => institution)
    .filter((institution) => typeof institution === "object")
    .map(({ id, name }) => ({ label: name, value: id }))
    .sort((a, b) => a.label.localeCompare(b.label))
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

export type InstitutionLogo = Pick<Institution, "id" | "name"> & {
  logo: Pick<Media, "id"> & { url: string; width?: number | null; height?: number | null }
}

// Only institutions that opted in with `showLogo` and actually have a logo uploaded -
// the public ticker has nothing to show for the rest.
export const getInstitutionsWithLogos = async (): Promise<InstitutionLogo[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.INSTITUTIONS,
    where: { showLogo: { equals: true }, logo: { exists: true } },
    select: { name: true, logo: true },
    depth: 1,
    pagination: false,
    sort: "name",
  })

  return docs.flatMap(({ id, name, logo }) => {
    if (typeof logo !== "object" || logo === null || !logo.url) return []
    return [
      { id, name, logo: { id: logo.id, url: logo.url, width: logo.width, height: logo.height } },
    ]
  })
}

export const getInstitutionOptionsCached = async () => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.INSTITUTIONS)
  return getInstitutionOptions()
}

export const getActiveInstitutionOptionsCached = async () => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.INSTITUTIONS, QueryKeys.MEMBERS.ROOT)
  return getActiveInstitutionOptions()
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

export const getInstitutionsWithLogosCached = async () => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.INSTITUTIONS)
  return getInstitutionsWithLogos()
}
