import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { Metadata } from "next"
import type { SearchParams } from "nuqs/server"
import { FallbackOnError } from "@/components/FallbackOnError"
import { FiltersUnavailable } from "@/components/FiltersUnavailable"
import { SuspenseSection } from "@/components/SuspenseSection"
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
import { Routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Publications",
  description: "Papers, theses and reports on computing capstones by members and their co-authors.",
}

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageContainer>
        <PublicationsHeader />
      </PageContainer>
      <FallbackOnError fallback={<FiltersUnavailable clearHref={Routes.PUBLICATIONS} />}>
        <AnimatedSuspense fallback={<PublicationsFilterServerSkeleton />}>
          <PublicationsFilterServer />
        </AnimatedSuspense>
      </FallbackOnError>
      <PageContainer>
        <SuspenseSection
          errorTitle="Could not load publications"
          errorVariant="list"
          fallback={<PublicationsListSkeleton />}
        >
          <PublicationsList searchParams={searchParams} />
        </SuspenseSection>
      </PageContainer>
    </>
  )
}
