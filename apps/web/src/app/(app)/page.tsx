import {
  HeroSection,
  MembersSection,
  ProposalsSection,
  TickerPlaceholder,
} from "@/features/home/components"
import { PageContainer } from "@/features/layout/components"

export default function Page() {
  return (
    <>
      <PageContainer>
        <HeroSection />
      </PageContainer>
      <TickerPlaceholder />
      <PageContainer>
        <MembersSection />
        <ProposalsSection />
      </PageContainer>
    </>
  )
}
