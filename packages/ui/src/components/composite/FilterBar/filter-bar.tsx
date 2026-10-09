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
type FilterBarFilterBase<TValue extends FilterBarValue = FilterBarValue> = {
  id: string
  /**
   * Shown while nothing is picked, and names the control for screen readers.
   * Also names the clear item, lowercased: "University" gives "Any university".
   */
  placeholder: string
  options: FilterBarOption<TValue>[]
}

/**
 * Picking one value replaces the last, or with `multiple` each pick adds to the selection.
 * A multiple filter keeps the trigger on its placeholder: what is picked belongs beside the
 * bar, where each value can be removed on its own.
 */
type FilterBarFilter<TValue extends FilterBarValue = FilterBarValue> =
  | (FilterBarFilterBase<TValue> & {
      multiple?: false
      value: TValue | null
      // Method syntax on purpose: it lets a FilterBarFilter<number> sit in a FilterBarFilter[].
      onValueChange(value: TValue | null): void
    })
  | (FilterBarFilterBase<TValue> & {
      multiple: true
      value: TValue[]
      onValueChange(value: TValue[]): void
      /** Once this many are picked the rest are disabled, so the cap is visible before it bites. */
      maxSelected?: number
    })

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
  /** Keeps the dropdowns and sort together, so they wrap to the next row as one group. */
  groupControls?: boolean
  sortOptions: FilterBarOption<TSort>[]
  sort: TSort
  onSortChange: (sort: TSort) => void
}

// Tabs and Select report values as unknown; each value came from our own options,
// so the casts below only restore the type the caller passed in.
function FilterBar<TStatus extends string = string, TSort extends string = string>({
  className,
  filters = [],
  groupControls = false,
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
  const controls = (
    <>
      {filters.map((filter) =>
        filter.multiple ? (
          <Select<FilterBarValue, true>
            items={filter.options}
            key={filter.id}
            multiple
            onValueChange={(value) =>
              filter.onValueChange(filter.maxSelected ? value.slice(0, filter.maxSelected) : value)
            }
            value={filter.value}
          >
            <SelectTrigger
              aria-label={filter.placeholder}
              className="h-10 shrink-0 px-4"
              variant="pill"
            >
              {/* Not SelectValue: the chips beside the bar already show what is picked, so the
              trigger stays on its placeholder rather than restating it. */}
              <span className="flex flex-1 text-left text-muted-foreground">
                {filter.placeholder}
              </span>
            </SelectTrigger>
            {/* The trigger is narrower than a long option, so the list sets its own width. */}
            <SelectContent alignItemWithTrigger={false} className="w-auto min-w-(--anchor-width)">
              {filter.options.map((option) => (
                <SelectItem
                  // At the cap only the picked ones stay live, so they can still be unpicked.
                  disabled={
                    filter.maxSelected !== undefined &&
                    filter.value.length >= filter.maxSelected &&
                    !filter.value.includes(option.value)
                  }
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select<FilterBarValue>
            items={filter.options}
            key={filter.id}
            onValueChange={(value) => filter.onValueChange(value)}
            value={filter.value}
          >
            <SelectTrigger
              aria-label={filter.placeholder}
              className="h-10 shrink-0 px-4"
              variant="pill"
            >
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
        ),
      )}

      <Select
        items={sortOptions}
        onValueChange={(value) => value !== null && onSortChange(value as TSort)}
        value={sort}
      >
        <SelectTrigger aria-label="Sort" className="h-10 shrink-0 px-4 md:ml-auto" variant="pill">
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
    </>
  )

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-3 md:flex-nowrap md:justify-start",
        className,
      )}
      data-slot="filter-bar"
      {...props}
    >
      {statusOptions.length > 0 && (
        <Tabs
          className="shrink-0"
          onValueChange={(value) => onStatusChange?.(value as TStatus)}
          value={status}
        >
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

      <InputGroup
        className="order-first h-10 w-full md:order-none md:w-80 md:min-w-32"
        variant="pill"
      >
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

      {groupControls ? (
        // Its own gap, not the outer bar's: a caller's className only reaches this
        // wrapper's properties through a descendant selector, never its own gap.
        <div
          className="flex flex-wrap items-center justify-center gap-2 md:mx-auto md:gap-3 xl:ml-auto xl:justify-start"
          data-slot="filter-bar-group"
        >
          {controls}
        </div>
      ) : (
        controls
      )}
    </div>
  )
}

type FilterBarSkeletonProps = React.ComponentProps<"div"> & {
  /** How many status tabs the real bar shows. Omit or pass 0 when it has none. */
  statusCount?: number
  /** How many select filters the real bar shows, not counting sort. */
  filterCount?: number
  /** Matches a grouped `FilterBar`, so the loading state doesn't jump to a different row count once the real bar replaces it. */
  groupControls?: boolean
}

/** Holds the same space as `FilterBar` while its options load, so nothing shifts. */
function FilterBarSkeleton({
  className,
  filterCount = 0,
  groupControls = false,
  statusCount = 0,
  ...props
}: FilterBarSkeletonProps) {
  const placeholders = (
    <>
      {Array.from({ length: filterCount }, (_, index) => `filter-${index}`).map((id) => (
        <Skeleton
          className="h-10 w-32 shrink-0 rounded-full"
          data-slot="filter-bar-skeleton-filter"
          key={id}
        />
      ))}
      <Skeleton className="h-10 w-36 shrink-0 rounded-full md:ml-auto" />
    </>
  )

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-3 md:flex-nowrap md:justify-start",
        className,
      )}
      data-slot="filter-bar-skeleton"
      {...props}
    >
      {statusCount > 0 && (
        <Skeleton
          className="h-10 shrink-0 rounded-full"
          data-slot="filter-bar-skeleton-status"
          // About one tab label ("Active - 12") per status.
          style={{ width: `${statusCount * 6}rem` }}
        />
      )}
      <Skeleton className="order-first h-10 w-full rounded-full md:order-none md:w-80 md:min-w-32" />
      {groupControls ? (
        <div
          className="flex flex-wrap items-center justify-center gap-2 md:mx-auto md:gap-3 xl:ml-auto xl:justify-start"
          data-slot="filter-bar-group"
        >
          {placeholders}
        </div>
      ) : (
        placeholders
      )}
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
