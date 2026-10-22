import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { Metadata } from "next"
import type { SearchParams } from "nuqs/server"
import { PageContainer, PageHeader } from "@/features/layout/components"
import { AddResourceTrigger } from "@/features/resources/components/AddResourceTrigger"
import {
  ResourcesFilterServer,
  ResourcesFilterServerSkeleton,
} from "@/features/resources/components/ResourcesFilterServer"
import { ResourcesList, ResourcesListSkeleton } from "@/features/resources/components/ResourcesList"

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
