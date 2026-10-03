"use client"

import { FilterBar, type FilterBarFilter } from "@repo/ui/components/composite"
import { debounce, useQueryStates } from "nuqs"
import type { InstitutionOption } from "@/features/institutions/institutions.queries"
import type { ResourceCourseOption } from "../resources.queries"
import { type ResourceSort, resourceSearchParams, resourceSorts } from "../resources.search-params"

const sortLabels: Record<ResourceSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  titleAsc: "Title A-Z",
}

const sortOptions = resourceSorts.map((value) => ({ label: sortLabels[value], value }))

type ResourcesFilterBarProps = {
  courses: ResourceCourseOption[]
  institutions: InstitutionOption[]
}

export const ResourcesFilterBar = ({ courses, institutions }: ResourcesFilterBarProps) => {
  // shallow: false re-runs the server component, which owns the query.
  const [params, setParams] = useQueryStates(resourceSearchParams, {
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
          id: "course",
          onValueChange: (course) => update({ course }),
          options: courses,
          placeholder: "Course",
          value: params.course,
        } satisfies FilterBarFilter<ResourceCourseOption["value"]>,
        {
          id: "institution",
          onValueChange: (institution) => update({ institution }),
          options: institutions,
          placeholder: "University",
          value: params.institution,
        } satisfies FilterBarFilter<InstitutionOption["value"]>,
      ]}
      // The input updates at once; only the URL, and so the server fetch, waits for a pause.
      // Clearing the search skips the wait, so the full list comes back at once.
      onSearchChange={(q) => update({ q }, { limitUrlUpdates: q ? debounce(300) : undefined })}
      onSortChange={(sort) => update({ sort })}
      search={params.q}
      searchPlaceholder="Search resources..."
      sort={params.sort}
      sortOptions={sortOptions}
    />
  )
}
