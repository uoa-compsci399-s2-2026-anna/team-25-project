import { Heading, Skeleton } from "@repo/ui/components/ui"
import { notFound } from "next/navigation"
import { getInstitutionNameCached } from "@/features/institutions/institutions.queries"
import { type CourseRouteParams, parseCourseId } from "../courses.params"
import { getPublishedCourseCached } from "../courses.queries"

export const CourseHeader = async ({ params }: { params: CourseRouteParams }) => {
  const courseId = await parseCourseId(params)

  const course = await getPublishedCourseCached(courseId)
  if (!course) notFound()

  const institutionId =
    typeof course.institution === "number" ? course.institution : course.institution.id
  const institution = await getInstitutionNameCached(institutionId)

  return (
    <header className="flex flex-col gap-2 lg:col-start-1 lg:row-start-2">
      <Heading level="h1">{course.code}</Heading>
      {institution && <p className="text-muted-foreground">{institution.name}</p>}
    </header>
  )
}

export const CourseHeaderSkeleton = () => (
  <div className="flex flex-col gap-3 lg:col-start-1 lg:row-start-2">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-4 w-48" />
  </div>
)
