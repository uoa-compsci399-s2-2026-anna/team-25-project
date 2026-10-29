import { AnimatedSuspense, Skeleton } from "@repo/ui/components/ui"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { PostProposalDialog } from "./PostProposalDialog"

// Only members can post a proposal. Reading the viewer is per-request, so it
// streams in beside the otherwise-static header.
export async function PostProposalTriggerForMember() {
  const { collection } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) return null
  return <PostProposalDialog />
}

export function PostProposalTrigger() {
  return (
    <AnimatedSuspense fallback={<Skeleton className="h-9 w-40 rounded-full" />}>
      <PostProposalTriggerForMember />
    </AnimatedSuspense>
  )
}
