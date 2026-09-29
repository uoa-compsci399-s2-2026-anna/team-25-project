import { AnimatedSuspense } from "@repo/ui/components/ui"
import { CoursesList, CoursesListSkeleton } from "@/features/courses/components/CoursesList"
import { PageContainer } from "@/features/layout/components"

export default function Page() {
  return (
    <PageContainer>
      <AnimatedSuspense fallback={<CoursesListSkeleton />}>
        <CoursesList />
      </AnimatedSuspense>
    </PageContainer>
  )
}
