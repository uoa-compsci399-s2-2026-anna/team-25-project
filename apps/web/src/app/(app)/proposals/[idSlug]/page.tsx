import { AnimatedSuspense } from "@repo/ui/components/ui"
import { BackLink, PageContainer } from "@/features/layout/components"
import { ProposalDetailSkeleton } from "@/features/proposals/components/ProposalDetailSkeleton/ProposalDetailSkeleton"
import { ProposalPage } from "@/features/proposals/components/ProposalPage/ProposalPage"
import { Routes } from "@/lib/routes"

export default function Page({ params }: { params: Promise<{ idSlug: string }> }) {
  return (
    <PageContainer>
      <div className="px-10 pt-10 md:px-12">
        <BackLink href={Routes.PROPOSALS.ROOT}>Proposals</BackLink>
      </div>
      <article className="grid w-full gap-x-10 gap-y-8 p-10 md:p-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-12">
        <AnimatedSuspense fallback={<ProposalDetailSkeleton />}>
          <ProposalPage params={params} />
        </AnimatedSuspense>
      </article>
    </PageContainer>
  )
}
