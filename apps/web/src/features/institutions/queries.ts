import { cacheTag } from "next/cache"
import type { InstitutionOption } from "@/features/auth/components"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

/**
 * Cached list of every institution, for the registration dropdown - public
 * and rarely changes. payload/hooks/Institutions.ts revalidates it on change.
 */
export const getInstitutionsCached = async (): Promise<InstitutionOption[]> => {
  "use cache"
  cacheTag("institutions")

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.INSTITUTIONS,
    limit: 500,
    select: { domains: true, name: true },
    sort: "name",
  })

  return docs.map((institution) => ({
    domains: institution.domains.map(({ domain }) => domain),
    id: institution.id,
    name: institution.name,
  }))
}
