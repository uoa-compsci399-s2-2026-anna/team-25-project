import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { Metadata } from "next"
import { FallbackOnError } from "@/components/FallbackOnError"
import { SuspenseSection } from "@/components/SuspenseSection"
import {
  CoursesHeader,
  CoursesHeaderSkeleton,
  CoursesList,
  CoursesListSkeleton,
} from "@/features/courses/components/CoursesList"
import { CoursesPageHeader } from "@/features/courses/components/CoursesPageHeader"
import { PageContainer } from "@/features/layout/components"

export const metadata: Metadata = {
  title: "Capstone courses",
  description: "How each institution structures its computing capstone course.",
}

export default function Page() {
  return (
    <PageContainer>
      <FallbackOnError fallback={<CoursesPageHeader />}>
        <AnimatedSuspense fallback={<CoursesHeaderSkeleton />}>
          <CoursesHeader />
        </AnimatedSuspense>
      </FallbackOnError>
      <SuspenseSection
        errorTitle="Could not load courses"
        errorVariant="list"
        fallback={<CoursesListSkeleton />}
      >
        <CoursesList />
      </SuspenseSection>
    </PageContainer>
  )
}
