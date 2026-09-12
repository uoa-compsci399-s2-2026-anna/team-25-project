"use client"

import {
  type ProposalStatus,
  ProposalStatusLabels,
  type ProposalTag,
  ProposalTagLabels,
} from "@repo/shared/enums/proposals"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import { FilterBar, type FilterBarFilter } from "@repo/ui/components/composite"
import { debounce, useQueryStates } from "nuqs"
import type { InstitutionOption } from "@/features/institutions/institutions.queries"
import {
  PROPOSAL_STATUS_ALL,
  type ProposalSort,
  proposalSearchParams,
  proposalSorts,
  proposalStatusFilters,
} from "../proposals.search-params"

const sortLabels: Record<ProposalSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
}

const sortOptions = proposalSorts.map((value) => ({ label: sortLabels[value], value }))
const tagOptions = toSelectOptions(ProposalTagLabels)

type ProposalsFilterBarProps = {
  counts: Record<ProposalStatus, number>
  institutions: InstitutionOption[]
}

export const ProposalsFilterBar = ({ counts, institutions }: ProposalsFilterBarProps) => {
  // shallow: false re-runs the server component, which owns the query.
  const [params, setParams] = useQueryStates(proposalSearchParams, {
    history: "replace",
    shallow: false,
  })

  // Any filter change moves back to the first page; null clears the key from the URL.
  const update = (next: Partial<typeof params>, options?: Parameters<typeof setParams>[1]) =>
    setParams({ ...next, page: null }, options)

  return (
    <FilterBar
      filters={[
        {
          id: "institution",
          onValueChange: (institution) => update({ institution }),
          options: institutions,
          placeholder: "University",
          value: params.institution,
        } satisfies FilterBarFilter<InstitutionOption["value"]>,
        {
          id: "tag",
          onValueChange: (tag) => update({ tag }),
          options: tagOptions,
          placeholder: "Interest area",
          value: params.tag,
        } satisfies FilterBarFilter<ProposalTag>,
      ]}
      // The input updates at once; only the URL, and so the server fetch, waits for a pause.
      // Clearing the search skips the wait, so the full list comes back at once.
      onSearchChange={(q) => update({ q }, { limitUrlUpdates: q ? debounce(300) : undefined })}
      onSortChange={(sort) => update({ sort })}
      onStatusChange={(status) => update({ status })}
      search={params.q}
      searchPlaceholder="Search proposals..."
      sort={params.sort}
      sortOptions={sortOptions}
      status={params.status}
      statusOptions={proposalStatusFilters.map((value) =>
        value === PROPOSAL_STATUS_ALL
          ? { label: "All", value }
          : { count: counts[value], label: ProposalStatusLabels[value], value },
      )}
    />
  )
}
