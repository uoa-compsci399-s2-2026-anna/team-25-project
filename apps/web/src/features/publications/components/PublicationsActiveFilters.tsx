"use client"

import { PublicationTypeLabels } from "@repo/shared/enums/publications"
import { Badge, Button, Eyebrow } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { XIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import type * as React from "react"
import { PUBLICATION_TAG_FILTER_MAX, publicationSearchParams } from "../publications.search-params"

export const PublicationsActiveFilters = ({ className, ...props }: React.ComponentProps<"div">) => {
  // shallow: false re-runs the server component, which owns the query.
  const [params, setParams] = useQueryStates(publicationSearchParams, {
    history: "replace",
    shallow: false,
  })

  // Removing a filter grows the list, so the page it was on may no longer exist.
  // The null-widened type is for `q`, whose own type never is.
  const update = (next: Partial<{ [K in keyof typeof params]: (typeof params)[K] | null }>) =>
    setParams({ ...next, page: null })

  const chips = [
    params.type !== null && {
      key: "type",
      label: PublicationTypeLabels[params.type],
      remove: () => update({ type: null }),
    },
    params.year !== null && {
      key: "year",
      label: String(params.year),
      remove: () => update({ year: null }),
    },
  ].filter((chip) => chip !== false)

  const tagChips = params.tags
    .filter((tag) => tag.trim())
    // Same cap the query applies, so the chips never claim more is filtering than is.
    .slice(0, PUBLICATION_TAG_FILTER_MAX)
    .map((tag) => ({
      key: `tag:${tag}`,
      label: tag.trim(),
      remove: () => update({ tags: params.tags.filter((value) => value !== tag) }),
    }))

  chips.push(...tagChips)

  if (chips.length === 0) return null

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}
      data-slot="publications-active-filters"
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

      <Button
        className="text-primary text-sm hover:underline"
        onClick={() => update({ q: null, tags: [], type: null, year: null })}
        size="sm"
        variant="button-unstyled"
      >
        Clear all
      </Button>
    </div>
  )
}
