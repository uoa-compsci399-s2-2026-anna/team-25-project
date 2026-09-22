import { Suspense } from "react"
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

export default function Page({ params }: { params: CourseRouteParams }) {
  return (
    <article className="grid w-full gap-x-10 gap-y-4 p-10 md:p-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-12">
      <Suspense fallback={<CourseOfferingMetaSkeleton />}>
        <CourseOfferingMeta params={params} />
      </Suspense>
      <Suspense fallback={<CourseHeaderSkeleton />}>
        <CourseHeader params={params} />
      </Suspense>
      <Suspense fallback={<CourseOfferingSkeleton />}>
        <CourseOffering params={params} />
      </Suspense>
    </article>
  )
}
