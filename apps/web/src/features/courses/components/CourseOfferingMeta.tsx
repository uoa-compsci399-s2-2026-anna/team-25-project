import { Badge, Skeleton } from "@repo/ui/components/ui"
import { formatDate } from "../courses.format"
import { type CourseRouteParams, parseCourseId } from "../courses.params"
import { getSelectedOffering } from "../courses.queries"

export const CourseOfferingMeta = async ({ params }: { params: CourseRouteParams }) => {
  const courseId = await parseCourseId(params)

  const offering = await getSelectedOffering(courseId)
  // The header 404s a course with nothing published, so this is only reachable
  // mid-publication. Render nothing rather than taking down the page.
  if (!offering) return null

  const publishedAt = formatDate(offering.publishedAt)
  const updatedAt = formatDate(offering.updatedAt)

  return (
    <div className="flex flex-wrap items-center gap-3 lg:col-start-1 lg:row-start-1">
      <Badge className="uppercase tracking-wide" variant="active">
        {offering.period}
      </Badge>
      {publishedAt && (
        <span className="text-muted-foreground text-xs">Published {publishedAt}</span>
      )}
      {updatedAt && updatedAt !== publishedAt && (
        <span className="text-muted-foreground text-xs">- updated {updatedAt}</span>
      )}
    </div>
  )
}

export const CourseOfferingMetaSkeleton = () => (
  <Skeleton className="h-5 w-56 lg:col-start-1 lg:row-start-1" />
)
