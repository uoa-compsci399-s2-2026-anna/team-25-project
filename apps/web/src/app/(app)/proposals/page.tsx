import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { Metadata } from "next"
import type { SearchParams } from "nuqs/server"
import { FallbackOnError } from "@/components/FallbackOnError"
import { SuspenseSection } from "@/components/SuspenseSection"
import { PageContainer } from "@/features/layout/components"
import {
  ProposalsFilterBarSkeleton,
  ProposalsFilterServer,
} from "@/features/proposals/components/ProposalsFilterServer"
import { ProposalsHeader } from "@/features/proposals/components/ProposalsHeader"
import { ProposalsList, ProposalsListSkeleton } from "@/features/proposals/components/ProposalsList"

export const metadata: Metadata = {
  title: "Research proposals",
  description:
    "Research ideas from members who look for co-investigators, data access or a second institution.",
}

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageContainer>
        <ProposalsHeader />
      </PageContainer>
      {/* Filters are optional: if they fail, hide the whole band and keep the list. */}
      <FallbackOnError fallback={null}>
        <div className="w-full bg-brand-cream/60">
          <PageContainer className="px-10 py-5 md:px-12">
            <AnimatedSuspense fallback={<ProposalsFilterBarSkeleton />}>
              <ProposalsFilterServer searchParams={searchParams} />
            </AnimatedSuspense>
          </PageContainer>
        </div>
      </FallbackOnError>
      <PageContainer>
        <SuspenseSection
          errorTitle="Could not load proposals"
          errorVariant="list"
          fallback={<ProposalsListSkeleton />}
        >
          <ProposalsList searchParams={searchParams} />
        </SuspenseSection>
      </PageContainer>
    </>
  )
}
