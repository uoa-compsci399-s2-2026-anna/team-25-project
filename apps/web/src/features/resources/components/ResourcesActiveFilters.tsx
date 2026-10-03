"use client"

import { Badge, Button, Eyebrow } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { XIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import type * as React from "react"
import type { InstitutionOption } from "@/features/institutions/institutions.queries"
import type { ResourceCourseOption } from "../resources.queries"
import { resourceSearchParams } from "../resources.search-params"

type ResourcesActiveFiltersProps = React.ComponentProps<"div"> & {
  courses: ResourceCourseOption[]
  institutions: InstitutionOption[]
}

export const ResourcesActiveFilters = ({
  className,
  courses,
  institutions,
  ...props
}: ResourcesActiveFiltersProps) => {
  // shallow: false re-runs the server component, which owns the query.
  const [params, setParams] = useQueryStates(resourceSearchParams, {
    history: "replace",
    shallow: false,
  })

  // Removing a filter grows the list, so the page it was on may no longer exist.
  // The null-widened type is for `q`, whose own type never is.
  const update = (next: Partial<{ [K in keyof typeof params]: (typeof params)[K] | null }>) =>
    setParams({ ...next, page: null })

  const chips = [
    params.course !== null && {
      key: "course",
      // A hand-edited id still gets a chip, so the filter stays removable.
      label: courses.find(({ value }) => value === params.course)?.label ?? "Unknown course",
      remove: () => update({ course: null }),
    },
    params.institution !== null && {
      key: "institution",
      label:
        institutions.find(({ value }) => value === params.institution)?.label ??
        "Unknown university",
      remove: () => update({ institution: null }),
    },
  ].filter((chip) => chip !== false)

  if (chips.length === 0) return null

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}
      data-slot="resources-active-filters"
      {...props}
    >
      <Eyebrow className="text-muted-foreground">Active filters</Eyebrow>

      {chips.map((chip) => (
        <Badge key={chip.key} variant="pink">
          {chip.label}
          <button
            aria-label={`Remove ${chip.label} filter`}
            // Badge only sizes its own direct children, so the icon is sized here.
            className="cursor-pointer rounded-full opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 [&>svg]:size-3"
            data-icon="inline-end"
            onClick={chip.remove}
            type="button"
          >
            <XIcon />
          </button>
        </Badge>
      ))}

      {/* Also clears the search, so nothing is left quietly narrowing the list. */}
      <Button
        className="text-primary text-sm hover:underline"
        onClick={() => update({ course: null, institution: null, q: null })}
        size="sm"
        variant="button-unstyled"
      >
        Clear all
      </Button>
    </div>
  )
}
