import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { MembersRouteParams } from "../members.params"
import { MemberBio } from "./MemberDetailBio"
import { MemberProposals, MemberProposalsSkeleton } from "./MemberDetailProposals"
import { MemberPublications, MemberPublicationsSkeleton } from "./MemberDetailPublications"

export const MemberDetailLeftColumn = ({ params }: { params: MembersRouteParams }) => (
  <div className="flex min-w-0 flex-col gap-8">
    <AnimatedSuspense>
      <MemberBio params={params} />
    </AnimatedSuspense>
    <AnimatedSuspense fallback={<MemberProposalsSkeleton />}>
      <MemberProposals params={params} />
    </AnimatedSuspense>
    <AnimatedSuspense fallback={<MemberPublicationsSkeleton />}>
      <MemberPublications params={params} />
    </AnimatedSuspense>
  </div>
)
