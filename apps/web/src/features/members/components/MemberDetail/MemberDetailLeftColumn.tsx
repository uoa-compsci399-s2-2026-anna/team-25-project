import { cn } from "@repo/ui/lib/utils"
import { SuspenseSection } from "@/components/SuspenseSection"
import type { MembersRouteParams } from "../../members.params"
import { MemberBio, MemberBioSkeleton } from "./MemberDetailBio"
import { MemberProposals, MemberProposalsSkeleton } from "./MemberDetailProposals"
import { MemberPublications, MemberPublicationsSkeleton } from "./MemberDetailPublications"
import { MemberResources, MemberResourcesSkeleton } from "./MemberDetailResources"
import { mobileSection } from "./mobileSection"

export const MemberDetailLeftColumn = ({ params }: { params: MembersRouteParams }) => (
  <div className="flex min-w-0 flex-col gap-8 max-md:contents">
    <SuspenseSection
      errorPlacementClassName={cn("max-md:order-3", mobileSection)}
      errorTitle="Could not load the bio"
      errorVariant="section"
      fallback={<MemberBioSkeleton />}
    >
      <MemberBio params={params} />
    </SuspenseSection>
    <SuspenseSection
      errorPlacementClassName={cn("max-md:order-4", mobileSection)}
      errorTitle="Could not load proposals"
      errorVariant="section"
      fallback={<MemberProposalsSkeleton />}
    >
      <MemberProposals params={params} />
    </SuspenseSection>
    <SuspenseSection
      errorPlacementClassName={cn("max-md:order-5", mobileSection)}
      errorTitle="Could not load resources"
      errorVariant="section"
      fallback={<MemberResourcesSkeleton />}
    >
      <MemberResources params={params} />
    </SuspenseSection>
    <SuspenseSection
      errorPlacementClassName={cn("max-md:order-7", mobileSection)}
      errorTitle="Could not load publications"
      errorVariant="section"
      fallback={<MemberPublicationsSkeleton />}
    >
      <MemberPublications params={params} />
    </SuspenseSection>
  </div>
)
