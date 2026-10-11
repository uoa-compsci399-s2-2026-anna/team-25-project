import { FilterBarSkeleton } from "@repo/ui/components/composite"
import { PageContainer } from "@/features/layout/components"
import { getPublicationTagsCached, getPublicationYearsCached } from "../publications.queries"
import { PublicationsActiveFilters } from "./PublicationsActiveFilters"
import { PublicationsFilterBar } from "./PublicationsFilterBar"

// Two strips on the page, but one Suspense boundary and one fetch of each option list.
export const PublicationsFilterServer = async () => {
  const [tags, years] = await Promise.all([getPublicationTagsCached(), getPublicationYearsCached()])

  return (
    <>
      <div className="w-full bg-brand-cream/60">
        <PageContainer className="px-10 py-5 md:px-12">
          <PublicationsFilterBar tags={tags} years={years} />
        </PageContainer>
      </div>
      <PageContainer>
        <PublicationsActiveFilters className="px-10 pt-6 md:px-12" />
      </PageContainer>
    </>
  )
}

// The active-filter chips render nothing until a filter is set, so they need no placeholder.
export const PublicationsFilterServerSkeleton = () => (
  <div className="w-full bg-brand-cream/60">
    <PageContainer className="px-10 py-5 md:px-12">
      <FilterBarSkeleton filterCount={3} />
    </PageContainer>
  </div>
)
