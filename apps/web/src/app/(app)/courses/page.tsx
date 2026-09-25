import { Suspense } from "react"
import { PageContainer } from "@/components/PageContainer"
import { CoursesList } from "@/features/courses/components/CoursesList"

export default function Page() {
  return (
    <PageContainer>
      <Suspense fallback={<div>loading..</div>}>
        <CoursesList />
      </Suspense>
    </PageContainer>
  )
}
