"use client"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { SearchIcon } from "lucide-react"
import type * as React from "react"

type FilterBarValue = string | number

type FilterBarOption<TValue extends FilterBarValue = string> = {
  value: TValue
  label: string
}

type FilterBarStatusOption<TValue extends string = string> = FilterBarOption<TValue> & {
  /** Omit to show the label alone. */
  count?: number
}

/**
 * Each filter keeps its own value type. Write it as `{ ... } satisfies FilterBarFilter<number>`
 * inside `filters` so the callback gets that type rather than the wider default.
 */
type FilterBarFilter<TValue extends FilterBarValue = FilterBarValue> = {
  id: string
  /**
   * Shown while nothing is picked, and names the control for screen readers.
   * Also names the clear item, lowercased: "University" gives "Any university".
   */
  placeholder: string
  options: FilterBarOption<TValue>[]
  value: TValue | null
  // Method syntax on purpose: it lets a FilterBarFilter<number> sit in a FilterBarFilter[].
  onValueChange(value: TValue | null): void
}

type FilterBarProps<
  TStatus extends string = string,
  TSort extends string = string,
> = React.ComponentProps<"div"> & {
  /** Omit to drop the status tabs; a bar that filters on nothing else has no use for them. */
  statusOptions?: FilterBarStatusOption<TStatus>[]
  status?: TStatus
  onStatusChange?: (status: TStatus) => void
  search: string
  onSearchChange: (search: string) => void
  searchPlaceholder?: string
  filters?: FilterBarFilter[]
  sortOptions: FilterBarOption<TSort>[]
  sort: TSort
  onSortChange: (sort: TSort) => void
}

// Tabs and Select report values as unknown; each value came from our own options,
// so the casts below only restore the type the caller passed in.
function FilterBar<TStatus extends string = string, TSort extends string = string>({
  className,
  filters = [],
  onSearchChange,
  onSortChange,
  onStatusChange,
  search,
  searchPlaceholder = "Search...",
  sort,
  sortOptions,
  status,
  statusOptions = [],
  ...props
}: FilterBarProps<TStatus, TSort>) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-3", className)}
      data-slot="filter-bar"
      {...props}
    >
      {statusOptions.length > 0 && (
        <Tabs onValueChange={(value) => onStatusChange?.(value as TStatus)} value={status}>
          <TabsList className="h-10" variant="pill">
            {statusOptions.map((option) => (
              <TabsTrigger className="px-4" key={option.value} value={option.value}>
                {option.label}
                {option.count !== undefined && ` - ${option.count}`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <InputGroup className="h-10 w-full sm:w-80" variant="pill">
        <InputGroupAddon className="pl-4">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          aria-label={searchPlaceholder}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={search}
        />
      </InputGroup>

      {filters.map((filter) => (
        <Select<FilterBarValue>
          items={filter.options}
          key={filter.id}
          onValueChange={(value) => filter.onValueChange(value)}
          value={filter.value}
        >
          <SelectTrigger aria-label={filter.placeholder} className="h-10 px-4" variant="pill">
            <SelectValue placeholder={filter.placeholder} />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Any {filter.placeholder.toLowerCase()}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      <Select
        items={sortOptions}
        onValueChange={(value) => value !== null && onSortChange(value as TSort)}
        value={sort}
      >
        <SelectTrigger aria-label="Sort" className="h-10 px-4 sm:ml-auto" variant="pill">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type FilterBarSkeletonProps = React.ComponentProps<"div"> & {
  /** How many status tabs the real bar shows. Omit or pass 0 when it has none. */
  statusCount?: number
  /** How many select filters the real bar shows, not counting sort. */
  filterCount?: number
}

/** Holds the same space as `FilterBar` while its options load, so nothing shifts. */
function FilterBarSkeleton({
  className,
  filterCount = 0,
  statusCount = 0,
  ...props
}: FilterBarSkeletonProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-3", className)}
      data-slot="filter-bar-skeleton"
      {...props}
    >
      {statusCount > 0 && (
        <Skeleton
          className="h-10 rounded-full"
          data-slot="filter-bar-skeleton-status"
          // About one tab label ("Active - 12") per status.
          style={{ width: `${statusCount * 6}rem` }}
        />
      )}
      <Skeleton className="h-10 w-full rounded-full sm:w-80" />
      {Array.from({ length: filterCount }, (_, index) => `filter-${index}`).map((id) => (
        <Skeleton
          className="h-10 w-32 rounded-full"
          data-slot="filter-bar-skeleton-filter"
          key={id}
        />
      ))}
      <Skeleton className="h-10 w-36 rounded-full sm:ml-auto" />
    </div>
  )
}

export {
  FilterBar,
  type FilterBarFilter,
  type FilterBarOption,
  type FilterBarProps,
  FilterBarSkeleton,
  type FilterBarSkeletonProps,
  type FilterBarStatusOption,
  type FilterBarValue,
}
