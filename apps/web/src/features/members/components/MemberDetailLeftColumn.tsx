import { Suspense } from "react"
import type { MembersRouteParams } from "../members.params"
import { MemberBio } from "./MemberDetailBio"
import { MemberProposals, MemberProposalsSkeleton } from "./MemberDetailProposals"
import { MemberPublications } from "./MemberDetailPublications"

export const MemberDetailLeftColumn = ({ params }: { params: MembersRouteParams }) => (
  <div className="flex min-w-0 flex-col gap-8">
    <Suspense>
      <MemberBio params={params} />
    </Suspense>
    <Suspense fallback={<MemberProposalsSkeleton />}>
      <MemberProposals params={params} />
    </Suspense>
    <MemberPublications />
  </div>
)
