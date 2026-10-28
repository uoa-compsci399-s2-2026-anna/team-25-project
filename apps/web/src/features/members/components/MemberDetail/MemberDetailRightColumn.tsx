import { cn } from "@repo/ui/lib/utils"
import { SuspenseSection } from "@/components/SuspenseSection"
import type { MembersRouteParams } from "../../members.params"
import { MemberContacts, MemberContactsSkeleton } from "./MemberDetailContacts"
import { MemberStats, MemberStatsSkeleton } from "./MemberDetailStats"
import { mobileSection } from "./mobileSection"

export const MemberDetailRightColumn = ({ params }: { params: MembersRouteParams }) => (
  <aside className="flex flex-col gap-4 max-md:contents">
    <SuspenseSection
      errorPlacementClassName={cn("max-md:order-2", mobileSection)}
      errorTitle="Could not load contact details"
      errorVariant="section"
      fallback={<MemberContactsSkeleton />}
    >
      <MemberContacts params={params} />
    </SuspenseSection>
    <SuspenseSection
      errorPlacementClassName={cn("max-md:order-7", mobileSection)}
      errorTitle="Could not load stats"
      errorVariant="section"
      fallback={<MemberStatsSkeleton />}
    >
      <MemberStats params={params} />
    </SuspenseSection>
  </aside>
)
