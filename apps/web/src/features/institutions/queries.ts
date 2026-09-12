import { cacheTag } from "next/cache"
import type { InstitutionOption } from "@/features/auth/components"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

export const getInstitutions = async (): Promise<InstitutionOption[]> => {
  "use cache"
  // Public, shared across every visitor, and rarely changes - ideal for the
  // build-time cache rather than a per-request read. revalidateTag("institutions")
  // in payload/hooks/Institutions.ts invalidates this the moment one changes.
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
