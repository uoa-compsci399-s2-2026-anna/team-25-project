import { Suspense } from "react"
import { CoursesList } from "@/features/courses/components/CoursesList"

export default function Page() {
  return (
    <Suspense fallback={<div>loading..</div>}>
      <CoursesList />
    </Suspense>
  )
}
