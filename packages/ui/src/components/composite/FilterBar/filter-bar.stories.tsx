import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { useState } from "react"
import { FilterBar, type FilterBarFilter, FilterBarSkeleton } from "./filter-bar"

const meta: Meta<typeof FilterBar> = {
  title: "composite/FilterBar",
  component: FilterBar,
}

export default meta

const institutions = [
  { label: "University of Auckland", value: 1 },
  { label: "University of Canterbury", value: 2 },
  { label: "University of Example", value: 3 },
]

const tags = [
  { label: "Assessment", value: "assessment" },
  { label: "Curriculum", value: "curriculum" },
  { label: "Generative AI", value: "generativeAi" },
]

export const Primary: StoryFn<typeof FilterBar> = () => {
  const [status, setStatus] = useState("active")
  const [search, setSearch] = useState("")
  const [institution, setInstitution] = useState<number | null>(null)
  const [tag, setTag] = useState<string | null>(null)
  const [sort, setSort] = useState("newest")

  return (
    <div className="bg-brand-cream/60 p-5">
      <FilterBar
        filters={[
          {
            id: "institution",
            onValueChange: (value) => setInstitution(value),
            options: institutions,
            placeholder: "University",
            value: institution,
          } satisfies FilterBarFilter<number>,
          {
            id: "tag",
            onValueChange: (value) => setTag(value),
            options: tags,
            placeholder: "Interest area",
            value: tag,
          } satisfies FilterBarFilter<string>,
        ]}
        onSearchChange={setSearch}
        onSortChange={setSort}
        onStatusChange={setStatus}
        search={search}
        searchPlaceholder="Search proposals..."
        sort={sort}
        sortOptions={[
          { label: "Newest first", value: "newest" },
          { label: "Oldest first", value: "oldest" },
        ]}
        status={status}
        statusOptions={[
          { count: 27, label: "Active", value: "active" },
          { count: 14, label: "Closed", value: "closed" },
          { label: "All", value: "all" },
        ]}
      />
    </div>
  )
}

/** A filter with `multiple` holds several options at once, up to `maxSelected`. */
export const MultiSelect: StoryFn<typeof FilterBar> = () => {
  const [search, setSearch] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sort, setSort] = useState("newest")

  return (
    <div className="bg-brand-cream/60 p-5">
      <FilterBar
        filters={[
          {
            id: "tags",
            maxSelected: 2,
            multiple: true,
            onValueChange: (value) => setSelectedTags(value),
            options: tags,
            placeholder: "Tags",
            value: selectedTags,
          } satisfies FilterBarFilter<string>,
        ]}
        onSearchChange={setSearch}
        onSortChange={setSort}
        search={search}
        searchPlaceholder="Search publications..."
        sort={sort}
        sortOptions={[
          { label: "Newest first", value: "newest" },
          { label: "Oldest first", value: "oldest" },
        ]}
      />
    </div>
  )
}

/** Holds the bar's space while its options load. */
export const Skeleton: StoryFn<typeof FilterBar> = () => (
  <div className="bg-brand-cream/60 p-5">
    <FilterBarSkeleton filterCount={2} statusCount={3} />
  </div>
)
