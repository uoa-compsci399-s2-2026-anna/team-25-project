import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { Metadata } from "next"
import type { SearchParams } from "nuqs/server"
import { FallbackOnError } from "@/components/FallbackOnError"
import { FiltersUnavailable } from "@/components/FiltersUnavailable"
import { SuspenseSection } from "@/components/SuspenseSection"
import { PageContainer, PageHeader } from "@/features/layout/components"
import { AddResourceTrigger } from "@/features/resources/components/AddResourceTrigger"
import {
  ResourcesFilterServer,
  ResourcesFilterServerSkeleton,
} from "@/features/resources/components/ResourcesFilterServer"
import { ResourcesList, ResourcesListSkeleton } from "@/features/resources/components/ResourcesList"
import { Routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Resources",
  description: "Rubrics, templates and other material that members share for capstone courses.",
}

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageContainer>
        <PageHeader
          actions={<AddResourceTrigger />}
          description="Material members have shared for reuse in their own capstone courses, such as rubrics, agreements, templates and reading."
          title="Resources"
        />
      </PageContainer>
      <FallbackOnError fallback={<FiltersUnavailable clearHref={Routes.RESOURCES.ROOT} />}>
        <AnimatedSuspense fallback={<ResourcesFilterServerSkeleton />}>
          <ResourcesFilterServer />
        </AnimatedSuspense>
      </FallbackOnError>
      <PageContainer>
        <SuspenseSection
          errorTitle="Could not load resources"
          errorVariant="list"
          fallback={<ResourcesListSkeleton />}
        >
          <ResourcesList searchParams={searchParams} />
        </SuspenseSection>
      </PageContainer>
    </>
  )
}
