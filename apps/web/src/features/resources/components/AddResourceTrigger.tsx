import { connection } from "next/server"
import { Suspense } from "react"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { getEditableCourseOptions } from "../resources.queries"
import { AddResourceDialog, AddResourceTriggerButton } from "./AddResourceDialog"

// The course options are the viewer's own, so they load here behind a Suspense boundary
// rather than in the page header, which stays the same for everyone and prerenders.
export async function AddResourceTriggerWithCourses() {
  // Marks this boundary dynamic during prerendering, and lets the course query's
  // `editors` join take its random table alias.
  await connection()
  const { collection, user } = await getCurrentUser()
  const courses =
    collection === Slugs.Collections.MEMBERS ? await getEditableCourseOptions(user.id) : []
  return <AddResourceDialog courses={courses} />
}

export function AddResourceTrigger() {
  return (
    // Only the bare button as the fallback, never a second dialog, so a click on it loses
    // nothing when the real one takes its place.
    <Suspense fallback={<AddResourceTriggerButton />}>
      <AddResourceTriggerWithCourses />
    </Suspense>
  )
}
