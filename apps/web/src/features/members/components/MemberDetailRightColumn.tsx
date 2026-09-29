import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { MembersRouteParams } from "../members.params"
import { MemberContacts, MemberContactsSkeleton } from "./MemberDetailContacts"
import { MemberStats, MemberStatsSkeleton } from "./MemberDetailStats"

export const MemberDetailRightColumn = ({ params }: { params: MembersRouteParams }) => (
  <aside className="flex flex-col gap-4">
    <AnimatedSuspense fallback={<MemberContactsSkeleton />}>
      <MemberContacts params={params} />
    </AnimatedSuspense>
    <AnimatedSuspense fallback={<MemberStatsSkeleton />}>
      <MemberStats params={params} />
    </AnimatedSuspense>
  </aside>
)
