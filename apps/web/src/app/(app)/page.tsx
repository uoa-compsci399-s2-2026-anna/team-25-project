import { Suspense } from "react"
import {
  AboutSection,
  BenefitsSection,
  HeroSection,
  InstitutionsTicker,
  InstitutionsTickerSkeleton,
  WhoCanJoinSection,
} from "@/features/home/components"
import { PageContainer } from "@/features/layout/components"

export default function Page() {
  return (
    <>
      <PageContainer>
        <HeroSection />
      </PageContainer>
      <Suspense fallback={<InstitutionsTickerSkeleton />}>
        <InstitutionsTicker />
      </Suspense>
      <PageContainer>
        <AboutSection />
        <BenefitsSection />
        <WhoCanJoinSection />
      </PageContainer>
    </>
  )
}
