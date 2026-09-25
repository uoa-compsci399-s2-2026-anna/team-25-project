import { Suspense } from "react"
import { CoursesList } from "@/features/courses/components/CoursesList"
import { PageContainer } from "@/features/layout/components"

export default function Page() {
  return (
    <PageContainer>
      <Suspense fallback={<div>loading..</div>}>
        <CoursesList />
      </Suspense>
    </PageContainer>
  )
}
