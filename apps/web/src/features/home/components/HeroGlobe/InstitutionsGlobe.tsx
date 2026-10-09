import { Skeleton } from "@repo/ui/components/ui"
import { getInstitutionMarkersCached } from "../../globe.queries"
import { HeroGlobe } from "./HeroGlobe"

// Loads its own markers so only the globe waits on them - the rest of the hero renders
// straight away. Lives outside HeroGlobe.tsx because that file is client code.
export const InstitutionsGlobe = async () => {
  const markers = await getInstitutionMarkersCached()
  return <HeroGlobe markers={markers} />
}

// Same box as HeroGlobe's wrapper and square canvas, so swapping them doesn't shift the hero.
export const HeroGlobeSkeleton = () => (
  <Skeleton className="aspect-square w-full max-w-md rounded-full" />
)
