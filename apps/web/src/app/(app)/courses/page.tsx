import { Suspense } from "react"
import { CoursesList } from "@/features/courses/components/CoursesList"

// The header now lives inside `CoursesList`, not here: its export button
// needs the same fetched rows as the table, not just the page shell.
export default function Page() {
  return (
    <Suspense fallback={<div>loading..</div>}>
      <CoursesList />
    </Suspense>
  )
}
