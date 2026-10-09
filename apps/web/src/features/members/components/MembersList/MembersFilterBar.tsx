"use client"

import { type InstitutionCountry, InstitutionCountryLabels } from "@repo/shared/enums/institutions"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import { FilterBar, type FilterBarFilter } from "@repo/ui/components/composite"
import { debounce, useQueryStates } from "nuqs"
import type { InstitutionOption } from "@/features/institutions/institutions.queries"
import type { ResearchInterestOption } from "../../members.queries"
import {
  MEMBER_INTEREST_FILTER_MAX,
  type MemberSort,
  memberSearchParams,
  memberSorts,
} from "../../members.search-params"

const sortLabels: Record<MemberSort, string> = {
  surnameAsc: "Surname A-Z",
  surnameDesc: "Surname Z-A",
}

const sortOptions = memberSorts.map((value) => ({ label: sortLabels[value], value }))
const countryOptions = toSelectOptions(InstitutionCountryLabels)

type MembersFilterBarProps = {
  institutions: InstitutionOption[]
  researchInterests: ResearchInterestOption[]
}

export const MembersFilterBar = ({ institutions, researchInterests }: MembersFilterBarProps) => {
  // shallow: false re-runs the server component, which owns the query.
  const [params, setParams] = useQueryStates(memberSearchParams, {
    history: "replace",
    shallow: false,
  })

  // Any change to what is listed moves back to the first page.
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
          id: "country",
          onValueChange: (country) => update({ country }),
          options: countryOptions,
          placeholder: "Country",
          value: params.country,
        } satisfies FilterBarFilter<InstitutionCountry>,
        {
          id: "interest",
          maxSelected: MEMBER_INTEREST_FILTER_MAX,
          multiple: true,
          // Each pick adds to the selection; the chips below remove them one at a time.
          onValueChange: (interest) => update({ interest }),
          options: researchInterests,
          placeholder: "Research interest",
          value: params.interest,
        } satisfies FilterBarFilter<string>,
      ]}
      // The input updates at once; only the URL waits. Clearing it skips the wait.
      onSearchChange={(q) => update({ q }, { limitUrlUpdates: q ? debounce(300) : undefined })}
      onSortChange={(sort) => update({ sort })}
      search={params.q}
      searchPlaceholder="Search name..."
      sort={params.sort}
      sortOptions={sortOptions}
    />
  )
}
