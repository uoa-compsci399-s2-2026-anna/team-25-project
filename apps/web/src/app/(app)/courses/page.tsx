import { AnimatedSuspense } from "@repo/ui/components/ui"
import { CoursesList, CoursesListSkeleton } from "@/features/courses/components/CoursesList"

export default function Page() {
  return (
    <AnimatedSuspense fallback={<CoursesListSkeleton />}>
      <CoursesList />
    </AnimatedSuspense>
  )
}
