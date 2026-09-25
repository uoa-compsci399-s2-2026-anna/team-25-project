import { AnimatedSuspense } from "@repo/ui/components/ui"
import { PageContainer } from "@/components/PageContainer"
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
