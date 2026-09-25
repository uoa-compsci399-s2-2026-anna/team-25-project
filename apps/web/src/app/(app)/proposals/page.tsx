import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { PageContainer } from "@/components/PageContainer"
import { ProposalsFilterServer } from "@/features/proposals/components/ProposalsFilterServer"
import { ProposalsHeader } from "@/features/proposals/components/ProposalsHeader"
import { ProposalsList } from "@/features/proposals/components/ProposalsList"

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageContainer>
        <ProposalsHeader />
      </PageContainer>
      <div className="w-full bg-brand-cream/60">
        <PageContainer className="px-10 py-5 md:px-12">
          <Suspense fallback={<div>loading..</div>}>
            <ProposalsFilterServer searchParams={searchParams} />
          </Suspense>
        </PageContainer>
      </div>
      <PageContainer>
        <Suspense fallback={<div>loading..</div>}>
          <ProposalsList searchParams={searchParams} />
        </Suspense>
      </PageContainer>
    </>
  )
}
