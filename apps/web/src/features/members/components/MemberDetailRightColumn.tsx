import { Suspense } from "react"
import type { MembersRouteParams } from "../members.params"
import { MemberContacts, MemberContactsSkeleton } from "./MemberDetailContacts"
import { MemberStats, MemberStatsSkeleton } from "./MemberDetailStats"

export const MemberDetailRightColumn = ({ params }: { params: MembersRouteParams }) => (
  <aside className="flex flex-col gap-4">
    <Suspense fallback={<MemberContactsSkeleton />}>
      <MemberContacts params={params} />
    </Suspense>
    <Suspense fallback={<MemberStatsSkeleton />}>
      <MemberStats params={params} />
    </Suspense>
  </aside>
)
