"use client"

import { type PublicationType, PublicationTypeLabels } from "@repo/shared/enums/publications"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import { FilterBar, type FilterBarFilter } from "@repo/ui/components/composite"
import { debounce, useQueryStates } from "nuqs"
import {
  PUBLICATION_TAG_FILTER_MAX,
  type PublicationSort,
  publicationSearchParams,
  publicationSorts,
} from "../publications.search-params"

const sortLabels: Record<PublicationSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  titleAsc: "Title A-Z",
}

const sortOptions = publicationSorts.map((value) => ({ label: sortLabels[value], value }))
const typeOptions = toSelectOptions(PublicationTypeLabels)

type PublicationsFilterBarProps = {
  tags: string[]
  years: number[]
}

export const PublicationsFilterBar = ({ tags, years }: PublicationsFilterBarProps) => {
  // shallow: false re-runs the server component, which owns the query.
  const [params, setParams] = useQueryStates(publicationSearchParams, {
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
          id: "type",
          onValueChange: (type) => update({ type }),
          options: typeOptions,
          placeholder: "Type",
          value: params.type,
        } satisfies FilterBarFilter<PublicationType>,
        {
          id: "year",
          onValueChange: (year) => update({ year }),
          options: years.map((year) => ({ label: String(year), value: year })),
          placeholder: "Year",
          value: params.year,
        } satisfies FilterBarFilter<number>,
        {
          id: "tags",
          maxSelected: PUBLICATION_TAG_FILTER_MAX,
          multiple: true,
          // Each pick adds to the selection; the chips below remove them one at a time.
          onValueChange: (tags) => update({ tags }),
          options: tags.map((tag) => ({ label: tag, value: tag })),
          placeholder: "Tags",
          value: params.tags,
        } satisfies FilterBarFilter<string>,
      ]}
      // The input updates at once; only the URL, and so the server fetch, waits for a pause.
      // Clearing the search skips the wait, so the full list comes back at once.
      onSearchChange={(q) => update({ q }, { limitUrlUpdates: q ? debounce(300) : undefined })}
      onSortChange={(sort) => update({ sort })}
      search={params.q}
      searchPlaceholder="Search publications..."
      sort={params.sort}
      sortOptions={sortOptions}
    />
  )
}
