import { QueryKeys } from "@repo/shared/constants/query-keys"
import { cacheLife, cacheTag } from "next/cache"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

export type GlobeMarker = {
  // Used in cobe's CSS anchor name (--cobe-<id>), so it's prefixed rather than a bare number.
  id: string
  location: [lat: number, lng: number]
  label: string
}

// Kept out of components/HeroGlobe: that folder is client code, and this reads Payload.
// The client only imports the GlobeMarker type, which is erased at build time.
export const getInstitutionMarkers = async (): Promise<GlobeMarker[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.INSTITUTIONS,
    depth: 0,
    pagination: false,
    select: { location: true, name: true },
  })
  return docs.map(({ id, location, name }) => ({
    id: `institution-${id}`,
    location: [location.latitude, location.longitude],
    label: name,
  }))
}

// payload/hooks/Institutions.ts revalidates this tag when an institution changes.
export const getInstitutionMarkersCached = async () => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.INSTITUTIONS)
  return getInstitutionMarkers()
}
