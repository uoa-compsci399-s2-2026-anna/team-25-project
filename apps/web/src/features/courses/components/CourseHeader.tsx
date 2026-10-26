import { Heading, Skeleton } from "@repo/ui/components/ui"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getInstitutionNameCached } from "@/features/institutions/institutions.queries"
import {
  type CourseRouteParams,
  type CourseRouteSearchParams,
  parseCourseId,
} from "../courses.params"
import { getPublishedCourseCached } from "../courses.queries"
import { DeleteCourseAction } from "./DeleteCourseAction"
import { OfferingActions } from "./OfferingActions"

export const CourseHeader = async ({
  params,
  searchParams,
}: {
  params: CourseRouteParams
  searchParams: CourseRouteSearchParams
}) => {
  const courseId = await parseCourseId(params)

  const course = await getPublishedCourseCached(courseId)
  if (!course) notFound()

  const institutionId =
    typeof course.institution === "number" ? course.institution : course.institution.id
  const institution = await getInstitutionNameCached(institutionId)

  return (
    <header className="flex flex-wrap items-start justify-between gap-4 lg:col-start-1 lg:row-start-2">
      <div className="flex flex-col gap-2">
        <Heading level="h1">{course.code}</Heading>
        {institution && <p className="text-muted-foreground">{institution.name}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Suspense fallback={null}>
          <OfferingActions courseId={courseId} searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={null}>
          <DeleteCourseAction code={course.code} courseId={courseId} />
        </Suspense>
      </div>
    </header>
  )
}

export const CourseHeaderSkeleton = () => (
  <div className="flex flex-col gap-3 lg:col-start-1 lg:row-start-2">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-4 w-48" />
  </div>
)
