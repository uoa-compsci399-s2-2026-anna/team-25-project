import { FilterBarSkeleton } from "@repo/ui/components/composite"
import type { SearchParams } from "nuqs/server"
import { getInstitutionOptionsCached } from "@/features/institutions/institutions.queries"
import { loadProposalStatusCounts } from "../proposals.queries"
import {
  loadProposalSearchParams,
  proposalStatusFilters,
  toProposalFilters,
} from "../proposals.search-params"
import { ProposalsFilterBar } from "./ProposalsFilterBar"

export const ProposalsFilterServer = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) => {
  const { institutionId, tag, search } = toProposalFilters(
    await loadProposalSearchParams(searchParams),
  )

  const [counts, institutions] = await Promise.all([
    loadProposalStatusCounts({ institutionId, tag, search }),
    getInstitutionOptionsCached(),
  ])

  return <ProposalsFilterBar counts={counts} institutions={institutions} />
}

export const ProposalsFilterBarSkeleton = () => (
  <FilterBarSkeleton filterCount={2} statusCount={proposalStatusFilters.length} />
)
