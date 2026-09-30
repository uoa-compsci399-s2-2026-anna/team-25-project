import { AnimatedSuspense } from "@repo/ui/components/ui"
import { BackLink } from "@/features/layout/components"
import { ProposalDetailSkeleton } from "@/features/proposals/components/ProposalDetailSkeleton/ProposalDetailSkeleton"
import { ProposalPage } from "@/features/proposals/components/ProposalPage/ProposalPage"
import { Routes } from "@/lib/routes"

export default function Page({ params }: { params: Promise<{ idSlug: string }> }) {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-8 pt-12">
        <BackLink href={Routes.PROPOSALS.ROOT}>Proposals</BackLink>
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 px-8 pt-8 pb-12 lg:grid-cols-[1fr_320px]">
        <AnimatedSuspense fallback={<ProposalDetailSkeleton />}>
          <ProposalPage params={params} />
        </AnimatedSuspense>
      </div>
    </>
  )
}
