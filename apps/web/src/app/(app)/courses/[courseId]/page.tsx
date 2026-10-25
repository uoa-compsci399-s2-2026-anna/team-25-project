import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { Metadata } from "next"
import { CourseHeader, CourseHeaderSkeleton } from "@/features/courses/components/CourseHeader"
import {
  CourseOffering,
  CourseOfferingSkeleton,
} from "@/features/courses/components/CourseOffering"
import {
  CourseOfferingMeta,
  CourseOfferingMetaSkeleton,
} from "@/features/courses/components/CourseOfferingMeta"
import {
  type CourseRouteParams,
  type CourseRouteSearchParams,
  parseCourseId,
} from "@/features/courses/courses.params"
import { getPublishedCourseCached } from "@/features/courses/courses.queries"
import { BackLink, PageContainer } from "@/features/layout/components"
import {
  CourseResources,
  CourseResourcesSkeleton,
} from "@/features/resources/components/CourseResources"
import { Routes } from "@/lib/routes"

export async function generateMetadata({
  params,
}: {
  params: CourseRouteParams
}): Promise<Metadata> {
  const course = await getPublishedCourseCached(await parseCourseId(params))
  return course ? { title: course.code } : {}
}

export default function Page({
  params,
  searchParams,
}: {
  params: CourseRouteParams
  searchParams: CourseRouteSearchParams
}) {
  return (
    <PageContainer>
      <BackLink href={Routes.COURSES.ROOT}>Courses</BackLink>
      <article className="grid w-full gap-x-10 gap-y-4 p-10 md:p-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-12">
        <AnimatedSuspense fallback={<CourseOfferingMetaSkeleton />}>
          <CourseOfferingMeta params={params} searchParams={searchParams} />
        </AnimatedSuspense>
        <AnimatedSuspense fallback={<CourseHeaderSkeleton />}>
          <CourseHeader params={params} searchParams={searchParams} />
        </AnimatedSuspense>
        <AnimatedSuspense fallback={<CourseOfferingSkeleton />}>
          <CourseOffering params={params} searchParams={searchParams} />
        </AnimatedSuspense>
        <AnimatedSuspense fallback={<CourseResourcesSkeleton />}>
          <CourseResources params={params} />
        </AnimatedSuspense>
      </article>
    </PageContainer>
  )
}
