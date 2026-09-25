import { AnimatedSuspense } from "@repo/ui/components/ui"
import { PageContainer } from "@/features/layout/components"
import { CourseHeader, CourseHeaderSkeleton } from "@/features/courses/components/CourseHeader"
import {
  CourseOffering,
  CourseOfferingSkeleton,
} from "@/features/courses/components/CourseOffering"
import {
  CourseOfferingMeta,
  CourseOfferingMetaSkeleton,
} from "@/features/courses/components/CourseOfferingMeta"
import type { CourseRouteParams } from "@/features/courses/courses.params"
import { PageContainer } from "@/features/layout/components"

export default function Page({ params }: { params: CourseRouteParams }) {
  return (
    <PageContainer>
      <article className="grid w-full gap-x-10 gap-y-4 p-10 md:p-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-12">
        <AnimatedSuspense fallback={<CourseOfferingMetaSkeleton />}>
          <CourseOfferingMeta params={params} />
        </AnimatedSuspense>
        <AnimatedSuspense fallback={<CourseHeaderSkeleton />}>
          <CourseHeader params={params} />
        </AnimatedSuspense>
        <AnimatedSuspense fallback={<CourseOfferingSkeleton />}>
          <CourseOffering params={params} />
        </AnimatedSuspense>
      </article>
    </PageContainer>
  )
}
