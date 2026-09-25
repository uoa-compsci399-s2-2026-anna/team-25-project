import { PageContainer } from "@/components/PageContainer"
import {
  AboutSection,
  BenefitsSection,
  HeroSection,
  JoinCommunityBand,
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
        <AboutSection />
        <BenefitsSection />
        <JoinCommunityBand />
      </PageContainer>
    </>
  )
}
