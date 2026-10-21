import type { Metadata } from "next"
import { PageContainer, PageHeader } from "@/features/layout/components"
import { CommunityGuidelines } from "@/features/legal/components/CommunityGuidelines"

export const metadata: Metadata = { title: "Community Guidelines" }

export default function Page() {
  return (
    <PageContainer>
      <PageHeader
        description="How members of the Computing Capstone Community Australasia work together and share each other's work."
        title="Community Guidelines"
      />
      <div className="max-w-4xl px-10 pb-16 md:px-12">
        <CommunityGuidelines />
      </div>
    </PageContainer>
  )
}
