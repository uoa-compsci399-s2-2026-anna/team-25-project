import type { Metadata } from "next"
import { PageContainer, PageHeader } from "@/features/layout/components"
import { PrivacyPolicy } from "@/features/legal/components/PrivacyPolicy"

export const metadata: Metadata = { title: "Privacy Policy" }

export default function Page() {
  return (
    <PageContainer>
      <PageHeader
        description="How the Computing Capstone Community Australasia collects, uses and protects your information."
        title="Privacy Policy"
      />
      {/* Matches PageHeader's horizontal padding so the policy lines up under the title. */}
      <div className="max-w-4xl px-10 pb-16 md:px-12">
        <PrivacyPolicy />
      </div>
    </PageContainer>
  )
}
