import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { useState } from "react"
import { FilterBar, type FilterBarFilter } from "./filter-bar"

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
