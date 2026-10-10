import { FilterBarSkeleton } from "@repo/ui/components/composite"
import { getInstitutionOptionsCached } from "@/features/institutions/institutions.queries"
import { PageContainer } from "@/features/layout/components"
import { getResearchInterestOptionsCached } from "../members.queries"
import { MembersActiveFilters } from "./MembersActiveFilters"
import { MembersFilterBar } from "./MembersFilterBar"

// Two strips on the page, but one Suspense boundary and one fetch of each option list.
export const MembersFilterServer = async () => {
  const [institutions, researchInterests] = await Promise.all([
    getInstitutionOptionsCached(),
    getResearchInterestOptionsCached(),
  ])

  return (
    <>
      <div className="w-full bg-brand-cream/60">
        <PageContainer className="px-10 py-5 md:px-12">
          <MembersFilterBar institutions={institutions} researchInterests={researchInterests} />
        </PageContainer>
      </div>
      <PageContainer>
        <MembersActiveFilters className="px-10 pt-6 md:px-12" institutions={institutions} />
      </PageContainer>
    </>
  )
}

// The active-filter chips render nothing until a filter is set, so they need no placeholder.
export const MembersFilterServerSkeleton = () => (
  <div className="w-full bg-brand-cream/60">
    <PageContainer className="px-10 py-5 md:px-12">
      <FilterBarSkeleton filterCount={3} groupControls />
    </PageContainer>
  </div>
)
