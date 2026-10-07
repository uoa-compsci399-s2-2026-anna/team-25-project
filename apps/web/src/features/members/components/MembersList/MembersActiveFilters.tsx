"use client"

import { InstitutionCountryLabels } from "@repo/shared/enums/institutions"
import { normaliseResearchInterests } from "@repo/shared/utils/research-interests"
import { Badge, Button, Eyebrow } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { XIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import type * as React from "react"
import type { InstitutionOption } from "@/features/institutions/institutions.queries"
import { MEMBER_INTEREST_FILTER_MAX, memberSearchParams } from "../../members.search-params"

type MembersActiveFiltersProps = React.ComponentProps<"div"> & {
  institutions: InstitutionOption[]
}

export const MembersActiveFilters = ({
  className,
  institutions,
  ...props
}: MembersActiveFiltersProps) => {
  // shallow: false re-runs the server component, which owns the query.
  const [params, setParams] = useQueryStates(memberSearchParams, {
    history: "replace",
    shallow: false,
  })

  // Removing a filter grows the list, so the page it was on may no longer exist.
  // The null-widened type is for `q`, whose own type never is.
  const update = (next: Partial<{ [K in keyof typeof params]: (typeof params)[K] | null }>) =>
    setParams({ ...next, page: null })

  const chips = [
    params.institution !== null && {
      key: "institution",
      // A hand-edited id still gets a chip, so the filter stays removable.
      label:
        institutions.find(({ value }) => value === params.institution)?.label ??
        "Unknown university",
      remove: () => update({ institution: null }),
    },
    params.country !== null && {
      key: "country",
      label: InstitutionCountryLabels[params.country],
      remove: () => update({ country: null }),
    },
  ].filter((chip) => chip !== false)

  // One chip per interest, each dropping only itself. Normalised as the query is, so a
  // hand-edited "?interest=" shows no empty chip and a repeat shows no second one.
  const interests = normaliseResearchInterests(params.interest)
  const interestChips = interests
    // Same cap the query applies, so the chips never claim more is filtering than is.
    .slice(0, MEMBER_INTEREST_FILTER_MAX)
    .map((interest) => ({
      key: `interest:${interest}`,
      label: interest,
      remove: () => update({ interest: interests.filter((value) => value !== interest) }),
    }))

  chips.push(...interestChips)

  if (chips.length === 0) return null

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}
      data-slot="members-active-filters"
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
        onClick={() => update({ country: null, institution: null, interest: [], q: null })}
        size="sm"
        variant="button-unstyled"
      >
        Clear all
      </Button>
    </div>
  )
}
