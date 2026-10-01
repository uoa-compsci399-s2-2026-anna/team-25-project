import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { SearchParams } from "nuqs/server"
import { PageContainer, PageHeader } from "@/features/layout/components"
import {
  PublicationsFilterBarSkeleton,
  PublicationsFilterServer,
} from "@/features/publications/components/PublicationsFilterServer"
import {
  PublicationsList,
  PublicationsListSkeleton,
} from "@/features/publications/components/PublicationsList"

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageContainer>
        <PageHeader
          description="Papers, theses and reports on computing capstones, written by members and their co-authors."
          title="Publications"
        />
      </PageContainer>
      <div className="w-full bg-brand-cream/60">
        <PageContainer className="px-10 py-5 md:px-12">
          <AnimatedSuspense fallback={<PublicationsFilterBarSkeleton />}>
            <PublicationsFilterServer />
          </AnimatedSuspense>
        </PageContainer>
      </div>
      <PageContainer>
        <AnimatedSuspense fallback={<PublicationsListSkeleton />}>
          <PublicationsList searchParams={searchParams} />
        </AnimatedSuspense>
      </PageContainer>
    </>
  )
}
