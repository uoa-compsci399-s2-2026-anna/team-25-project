import { Suspense } from "react"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { AddPublicationDialog } from "./AddPublicationDialog"

// The publications page is public, so only members see the button. Reading the
// viewer is per-request, so it streams in beside the otherwise-static header.
export async function AddPublicationTriggerForMember() {
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) return null
  return <AddPublicationDialog defaultAuthorName={`${user.firstName} ${user.lastName}`} />
}

export function AddPublicationTrigger() {
  return (
    <Suspense fallback={null}>
      <AddPublicationTriggerForMember />
    </Suspense>
  )
}
