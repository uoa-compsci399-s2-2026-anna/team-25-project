import { FilterBarSkeleton } from "@repo/ui/components/composite"
import { getInstitutionOptionsCached } from "@/features/institutions/institutions.queries"
import { PageContainer } from "@/features/layout/components"
import { getResourceCourseOptionsCached } from "../resources.queries"
import { ResourcesActiveFilters } from "./ResourcesActiveFilters"
import { ResourcesFilterBar } from "./ResourcesFilterBar"

// Two strips on the page, but one Suspense boundary and one fetch of each option list.
export const ResourcesFilterServer = async () => {
  const [courses, institutions] = await Promise.all([
    getResourceCourseOptionsCached(),
    getInstitutionOptionsCached(),
  ])

  return (
    <>
      <div className="w-full bg-brand-cream/60">
        <PageContainer className="px-10 py-5 md:px-12">
          <ResourcesFilterBar courses={courses} institutions={institutions} />
        </PageContainer>
      </div>
      <PageContainer>
        <ResourcesActiveFilters
          className="px-10 pt-6 md:px-12"
          courses={courses}
          institutions={institutions}
        />
      </PageContainer>
    </>
  )
}

// The active-filter chips render nothing until a filter is set, so they need no placeholder.
export const ResourcesFilterServerSkeleton = () => (
  <div className="w-full bg-brand-cream/60">
    <PageContainer className="px-10 py-5 md:px-12">
      <FilterBarSkeleton filterCount={2} />
    </PageContainer>
  </div>
)
