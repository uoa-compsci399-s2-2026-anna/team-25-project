import { Suspense } from "react"
import { FallbackOnError } from "@/components/FallbackOnError"
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
      {/* Decorative, so it hides on error in the same way it hides with no institutions. */}
      <FallbackOnError fallback={null}>
        <Suspense fallback={<InstitutionsTickerSkeleton />}>
          <InstitutionsTicker />
        </Suspense>
      </FallbackOnError>
      <PageContainer>
        <AboutSection />
        <BenefitsSection />
        <WhoCanJoinSection />
      </PageContainer>
    </>
  )
}
