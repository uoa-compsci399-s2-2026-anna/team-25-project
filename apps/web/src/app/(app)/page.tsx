import { Suspense } from "react"
import {
  AboutSection,
  BenefitsSection,
  HeroSection,
  InstitutionsTicker,
  InstitutionsTickerSkeleton,
  WhoCanJoinSection,
} from "@/features/home/components"
import { getInstitutionMarkersCached } from "@/features/home/globe.queries"
import { PageContainer } from "@/features/layout/components"

export default async function Page() {
  const markers = await getInstitutionMarkersCached()

  return (
    <>
      <PageContainer>
        <HeroSection markers={markers} />
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
