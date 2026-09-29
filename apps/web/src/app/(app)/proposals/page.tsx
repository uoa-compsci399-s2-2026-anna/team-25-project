import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { SearchParams } from "nuqs/server"
import { PageContainer } from "@/features/layout/components"
import {
  ProposalsFilterBarSkeleton,
  ProposalsFilterServer,
} from "@/features/proposals/components/ProposalsFilterServer"
import { ProposalsHeader } from "@/features/proposals/components/ProposalsHeader"
import { ProposalsList, ProposalsListSkeleton } from "@/features/proposals/components/ProposalsList"

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageContainer>
        <ProposalsHeader />
      </PageContainer>
      <div className="w-full bg-brand-cream/60">
        <PageContainer className="px-10 py-5 md:px-12">
          <AnimatedSuspense fallback={<ProposalsFilterBarSkeleton />}>
            <ProposalsFilterServer searchParams={searchParams} />
          </AnimatedSuspense>
        </PageContainer>
      </div>
      <PageContainer>
        <AnimatedSuspense fallback={<ProposalsListSkeleton />}>
          <ProposalsList searchParams={searchParams} />
        </AnimatedSuspense>
      </PageContainer>
    </>
  )
}
