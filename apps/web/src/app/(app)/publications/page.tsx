import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { SearchParams } from "nuqs/server"
import { PageContainer } from "@/features/layout/components"
import {
  PublicationsFilterServer,
  PublicationsFilterServerSkeleton,
} from "@/features/publications/components/PublicationsFilterServer"
import { PublicationsHeader } from "@/features/publications/components/PublicationsHeader"
import {
  PublicationsList,
  PublicationsListSkeleton,
} from "@/features/publications/components/PublicationsList"

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageContainer>
        <PublicationsHeader />
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
