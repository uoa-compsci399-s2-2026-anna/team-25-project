import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { Metadata } from "next"
import { CoursesList, CoursesListSkeleton } from "@/features/courses/components/CoursesList"
import { PageContainer } from "@/features/layout/components"

export const metadata: Metadata = {
  title: "Capstone courses",
  description: "How each institution structures its computing capstone course.",
}

export default function Page() {
  return (
    <PageContainer>
      <AnimatedSuspense fallback={<CoursesListSkeleton />}>
        <CoursesList />
      </AnimatedSuspense>
    </PageContainer>
  )
}
