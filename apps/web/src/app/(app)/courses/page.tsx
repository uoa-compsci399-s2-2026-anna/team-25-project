import { AnimatedSuspense } from "@repo/ui/components/ui"
import { PageContainer } from "@/features/layout/components"
import { CoursesList, CoursesListSkeleton } from "@/features/courses/components/CoursesList"

export default function Page() {
  return (
    <PageContainer>
      <AnimatedSuspense fallback={<CoursesListSkeleton />}>
        <CoursesList />
      </AnimatedSuspense>
    </PageContainer>
  )
}
