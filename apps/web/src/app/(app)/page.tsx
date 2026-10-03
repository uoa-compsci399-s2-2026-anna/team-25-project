import {
  AboutSection,
  BenefitsSection,
  HeroSection,
  TickerPlaceholder,
  WhoCanJoinSection,
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
        <WhoCanJoinSection />
      </PageContainer>
    </>
  )
}
