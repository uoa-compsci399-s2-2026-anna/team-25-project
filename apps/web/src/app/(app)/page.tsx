import { PageContainer } from "@/components/PageContainer"
import {
  HeroSection,
  MembersSection,
  ProposalsSection,
  TickerPlaceholder,
} from "@/features/home/components"

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
