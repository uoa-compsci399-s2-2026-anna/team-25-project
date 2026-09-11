import { Suspense } from "react"
import { ProposalsList } from "@/features/proposals/components/ProposalsList"

export default function Page() {
  return (
    <Suspense fallback={<div>loading..</div>}>
      <ProposalsList />
    </Suspense>
  )
}
