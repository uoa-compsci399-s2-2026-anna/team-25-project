import { AnimatedSuspense } from "@repo/ui/components/ui"
import { BackLink, PageContainer } from "@/features/layout/components"
import { ResourcePage, ResourcePageSkeleton } from "@/features/resources/components/ResourcePage"
import type { ResourceRouteParams } from "@/features/resources/resources.params"
import { Routes } from "@/lib/routes"

export default function Page({ params }: { params: ResourceRouteParams }) {
  return (
    <PageContainer>
      <BackLink href={Routes.RESOURCES.ROOT}>Resources</BackLink>
      <article className="grid w-full gap-x-10 gap-y-8 p-10 md:p-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-12">
        <AnimatedSuspense fallback={<ResourcePageSkeleton />}>
          <ResourcePage params={params} />
        </AnimatedSuspense>
      </article>
    </PageContainer>
  )
}
