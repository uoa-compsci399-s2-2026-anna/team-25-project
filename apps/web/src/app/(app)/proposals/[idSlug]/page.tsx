import { Suspense } from "react"
import { MemberOnly } from "@/features/auth/components/MemberOnly/MemberOnly"
import { ProposalDetailSkeleton } from "@/features/proposals/components/ProposalDetailSkeleton/ProposalDetailSkeleton"
import { ProposalPage } from "@/features/proposals/components/ProposalPage/ProposalPage"

export default function Page({ params }: { params: Promise<{ idSlug: string }> }) {
  return (
    <MemberOnly>
      <div className="mx-auto grid max-w-6xl gap-8 px-8 py-12 lg:grid-cols-[1fr_320px]">
        <Suspense fallback={<ProposalDetailSkeleton />}>
          <ProposalPage params={params} />
        </Suspense>
      </div>
    </MemberOnly>
  )
}
