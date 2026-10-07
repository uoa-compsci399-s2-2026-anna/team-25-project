import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { SearchParams } from "nuqs/server"
import { PageContainer, PageHeader } from "@/features/layout/components"
import { AddResourceTrigger } from "@/features/resources/components/AddResourceTrigger"
import {
  ResourcesFilterServer,
  ResourcesFilterServerSkeleton,
} from "@/features/resources/components/ResourcesFilterServer"
import { ResourcesList, ResourcesListSkeleton } from "@/features/resources/components/ResourcesList"

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
      <AnimatedSuspense fallback={<ResourcesFilterServerSkeleton />}>
        <ResourcesFilterServer />
      </AnimatedSuspense>
      <PageContainer>
        <AnimatedSuspense fallback={<ResourcesListSkeleton />}>
          <ResourcesList searchParams={searchParams} />
        </AnimatedSuspense>
      </PageContainer>
    </>
  )
}
