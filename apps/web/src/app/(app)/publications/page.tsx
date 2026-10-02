import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { SearchParams } from "nuqs/server"
import { PageContainer, PageHeader } from "@/features/layout/components"
import {
  PublicationsFilterServer,
  PublicationsFilterServerSkeleton,
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
      <AnimatedSuspense fallback={<PublicationsFilterServerSkeleton />}>
        <PublicationsFilterServer />
      </AnimatedSuspense>
      <PageContainer>
        <AnimatedSuspense fallback={<PublicationsListSkeleton />}>
          <PublicationsList searchParams={searchParams} />
        </AnimatedSuspense>
      </PageContainer>
    </>
  )
}
