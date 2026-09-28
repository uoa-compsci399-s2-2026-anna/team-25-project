import { Suspense } from "react"
import { CoursesList, CoursesListSkeleton } from "@/features/courses/components/CoursesList"

export default function Page() {
  return (
    <Suspense fallback={<CoursesListSkeleton />}>
      <CoursesList />
    </Suspense>
  )
}
