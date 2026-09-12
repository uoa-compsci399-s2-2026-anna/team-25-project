import { connection } from "next/server"
import type { InstitutionOption } from "@/features/auth/components"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

export const getInstitutions = async (): Promise<InstitutionOption[]> => {
  // Institutions live in Postgres, so this must not run while prerendering or
  // the build itself would need a live database. connection() defers it to a
  // real request; the caller's Suspense boundary keeps the rest of the page
  // prerenderable in the meantime.
  await connection()

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.INSTITUTIONS,
    limit: 500,
    sort: "name",
  })

  return docs.map((institution) => ({
    domains: institution.domains.map(({ domain }) => domain),
    id: institution.id,
    name: institution.name,
  }))
}
