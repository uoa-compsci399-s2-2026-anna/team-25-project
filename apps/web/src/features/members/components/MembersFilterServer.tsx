import { getInstitutionOptionsCached } from "@/features/institutions/institutions.queries"
import { PageContainer } from "@/features/layout/components"
import { MembersActiveFilters } from "./MembersActiveFilters"
import { MembersFilterBar } from "./MembersFilterBar"

// Two strips on the page, but one institutions fetch and one Suspense boundary.
export const MembersFilterServer = async () => {
  const institutions = await getInstitutionOptionsCached()

  return (
    <>
      <div className="w-full bg-brand-cream/60">
        <PageContainer className="px-10 py-5 md:px-12">
          <MembersFilterBar institutions={institutions} />
        </PageContainer>
      </div>
      <PageContainer>
        <MembersActiveFilters className="px-10 pt-6 md:px-12" institutions={institutions} />
      </PageContainer>
    </>
  )
}
