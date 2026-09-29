import {
  AboutSection,
  BenefitsSection,
  HeroSection,
  JoinCommunityBand,
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
        <AboutSection />
        <BenefitsSection />
        <JoinCommunityBand />
      </PageContainer>
    </>
  )
}
