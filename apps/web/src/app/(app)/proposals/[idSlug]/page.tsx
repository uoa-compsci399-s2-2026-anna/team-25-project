import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { Metadata } from "next"
import { BackLink, PageContainer } from "@/features/layout/components"
import { ProposalDetailSkeleton } from "@/features/proposals/components/ProposalDetailSkeleton/ProposalDetailSkeleton"
import {
  ProposalPage,
  parseProposalId,
} from "@/features/proposals/components/ProposalPage/ProposalPage"
import { getProposalByIdCached } from "@/features/proposals/proposals.queries"
import { Routes } from "@/lib/routes"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ idSlug: string }>
}): Promise<Metadata> {
  const id = parseProposalId((await params).idSlug)
  const proposal = id === null ? null : await getProposalByIdCached(id)
  return proposal ? { title: proposal.title } : {}
}

export default function Page({ params }: { params: Promise<{ idSlug: string }> }) {
  return (
    <PageContainer>
      <BackLink href={Routes.PROPOSALS.ROOT}>Proposals</BackLink>
      <article className="grid w-full gap-x-10 gap-y-8 p-10 md:p-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-12">
        <AnimatedSuspense fallback={<ProposalDetailSkeleton />}>
          <ProposalPage params={params} />
        </AnimatedSuspense>
      </article>
    </PageContainer>
  )
}
