import { Heading, Skeleton } from "@repo/ui/components/ui"
import { connection } from "next/server"
import { Suspense } from "react"
import type { InstitutionOption } from "@/features/auth/components"
import { RegisterDetailsForm, RegisterStepper } from "@/features/auth/components"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

const getInstitutions = async (): Promise<InstitutionOption[]> => {
  // Institutions live in Postgres, so this must not run while prerendering or
  // the build itself would need a live database. connection() defers it to a
  // real request; the Suspense boundary below keeps the rest of the page
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

const RegisterFormSection = async () => {
  const institutions = await getInstitutions()

  return <RegisterDetailsForm institutions={institutions} />
}

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-16">
      <RegisterStepper current={1} />

      <div className="flex flex-col gap-3 text-center">
        <Heading level="h1">Join CCCA</Heading>
        <p className="text-muted-foreground">
          Free for academics teaching or researching computing capstones at an Australian or New
          Zealand university.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[32rem] w-full rounded-lg" />}>
        <RegisterFormSection />
      </Suspense>
    </main>
  )
}
