import { AnimatedSuspense, Skeleton } from "@repo/ui/components/ui"
import { connection } from "next/server"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { getEditableCourseOptions } from "../resources.queries"
import { AddResourceDialog } from "./AddResourceDialog"

// Only members can share a resource, and the course options are the viewer's own, so this
// loads behind a Suspense boundary rather than in the page header, which stays the same for
// everyone and prerenders.
export async function AddResourceTriggerWithCourses() {
  // Marks this boundary dynamic during prerendering, and lets the course query's
  // `editors` join take its random table alias.
  await connection()
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) return null
  return <AddResourceDialog courses={await getEditableCourseOptions(user.id)} />
}

export function AddResourceTrigger() {
  return (
    <AnimatedSuspense fallback={<Skeleton className="h-9 w-48 rounded-full" />}>
      <AddResourceTriggerWithCourses />
    </AnimatedSuspense>
  )
}
