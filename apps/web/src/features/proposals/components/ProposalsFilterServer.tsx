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
  <FilterBarSkeleton
    // Matches ProposalsFilterBar's own layout, so the loading state doesn't jump
    // to a different row count once the real bar replaces it.
    className="min-[1080px]:justify-start! md:flex-wrap md:justify-center"
    filterCount={2}
    groupControls
    statusCount={proposalStatusFilters.length}
  />
)
