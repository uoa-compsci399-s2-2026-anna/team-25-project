import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { SearchParams } from "nuqs/server"
import {
  ProposalsFilterBarSkeleton,
  ProposalsFilterServer,
} from "@/features/proposals/components/ProposalsFilterServer"
import { ProposalsHeader } from "@/features/proposals/components/ProposalsHeader"
import { ProposalsList, ProposalsListSkeleton } from "@/features/proposals/components/ProposalsList"

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <ProposalsHeader />
      <div className="w-full bg-brand-cream/60 px-10 py-5 md:px-12">
        <AnimatedSuspense fallback={<ProposalsFilterBarSkeleton />}>
          <ProposalsFilterServer searchParams={searchParams} />
        </AnimatedSuspense>
      </div>
      <AnimatedSuspense fallback={<ProposalsListSkeleton />}>
        <ProposalsList searchParams={searchParams} />
      </AnimatedSuspense>
    </>
  )
}
