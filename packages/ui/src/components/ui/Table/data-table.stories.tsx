import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { createColumnHelper } from "@tanstack/react-table"
import { Badge } from "../Badge/badge"
import { Button } from "../Button/button"
import { BadgeCell, SortableHeader, StackedCell, TextCell } from "./cells"
import { DataTable, type DataTableProps } from "./data-table"
import type { DataTableFeatures } from "./data-table-features"
import { useDataTable } from "./hooks/use-data-table"

interface Course {
  id: string
  title: string
  lecturer: string
  university: string
  duration: string
  students: number
  teamSize: string
  industry: "Required" | "Optional" | "None"
}

const courses: Array<Course> = [
  {
    id: "1",
    title: "COMP 693 Capstone Project",
    lecturer: "A. Tui",
    university: "University of Auckland",
    duration: "Year long",
    students: 180,
    teamSize: "4-5",
    industry: "Required",
  },
  {
    id: "2",
    title: "SOFTENG 700 Research Project",
    lecturer: "M. Rahman",
    university: "University of Auckland",
    duration: "Year long",
    students: 96,
    teamSize: "1",
    industry: "Optional",
  },
  {
    id: "3",
    title: "ENGR 302 Team Project",
    lecturer: "K. Whitfield",
    university: "Victoria University",
    duration: "One trimester",
    students: 64,
    teamSize: "5-6",
    industry: "Required",
  },
  {
    id: "4",
    title: "COSC 349 Cloud Computing",
    lecturer: "P. Nguyen",
    university: "University of Otago",
    duration: "One semester",
    students: 42,
    teamSize: "2-3",
    industry: "None",
  },
  {
    id: "5",
    title: "CS 399 Industry Project",
    lecturer: "J. Okafor",
    university: "University of Canterbury",
    duration: "Year long",
    students: 128,
    teamSize: "4-5",
    industry: "Required",
  },
]

const industryVariants = {
  Required: "salmon",
  Optional: "blue",
  None: "secondary",
} as const

const helper = createColumnHelper<DataTableFeatures, Course>()

const columns = helper.columns([
  helper.accessor("title", {
    header: ({ column }) => <SortableHeader column={column}>Course</SortableHeader>,
    cell: ({ row }) => (
      <StackedCell primary={row.original.title} secondary={row.original.lecturer} />
    ),
  }),
  helper.accessor("university", {
    header: ({ column }) => <SortableHeader column={column}>University</SortableHeader>,
    cell: ({ getValue }) => <TextCell tone="muted">{getValue()}</TextCell>,
    filterFn: "arrHas",
  }),
  helper.accessor("duration", {
    header: "Duration",
    cell: ({ getValue }) => <TextCell tone="muted">{getValue()}</TextCell>,
    filterFn: "arrHas",
  }),
  helper.accessor("students", {
    header: ({ column }) => <SortableHeader column={column}>Students</SortableHeader>,
    cell: ({ getValue }) => <TextCell tone="muted">{getValue()}</TextCell>,
  }),
  helper.accessor("teamSize", {
    header: "Team size",
    cell: ({ getValue }) => <TextCell tone="muted">{getValue()}</TextCell>,
  }),
  helper.accessor("industry", {
    header: "Industry",
    enableSorting: false,
    filterFn: "arrHas",
    cell: ({ getValue }) => {
      const value = getValue()
      return <BadgeCell variant={industryVariants[value]}>{value}</BadgeCell>
    },
  }),
])

type StoryArgs = Omit<DataTableProps<Course>, "table">

const meta: Meta<typeof DataTable> = {
  title: "ui/DataTable",
  component: DataTable,
  parameters: {
    layout: "padded",
  },
  args: {
    density: "comfortable",
    emptyMessage: "No results.",
    striped: false,
  },
  argTypes: {
    density: {
      control: { type: "inline-radio" },
      options: ["comfortable", "compact"],
    },
    striped: {
      control: { type: "boolean" },
    },
    // Built in each story by `useDataTable`, so there is nothing to pick here.
    table: {
      table: { disable: true },
    },
  },
}

export default meta
type Story = StoryFn<StoryArgs>

export const Default: Story = (args) => {
  const table = useDataTable({ columns, data: courses })
  return <DataTable {...args} table={table} />
}

export const Compact: Story = (args) => {
  const table = useDataTable({ columns, data: courses })
  return <DataTable {...args} table={table} />
}
Compact.args = { density: "compact" } satisfies StoryArgs

export const Striped: Story = (args) => {
  const table = useDataTable({ columns, data: courses })
  return <DataTable {...args} table={table} />
}
Striped.args = { striped: true } satisfies StoryArgs

export const Empty: Story = (args) => {
  const table = useDataTable({ columns, data: [] })
  return <DataTable {...args} table={table} />
}
Empty.args = { emptyMessage: "No courses match these filters." } satisfies StoryArgs

export const SortedByDefault: Story = (args) => {
  const table = useDataTable({
    columns,
    data: courses,
    initialState: { sorting: [{ id: "students", desc: true }] },
  })
  return <DataTable {...args} table={table} />
}

/**
 * Filter controls sit outside the table and drive it through the shared instance,
 * which is why `useDataTable` is a hook rather than internal to `DataTable`. The
 * chip options come from `getFacetedUniqueValues()`, so they follow the data.
 */
export const WithExternalFilters: Story = (args) => {
  const table = useDataTable({ columns, data: courses })

  const column = table.getColumn("university")
  const selected = (column?.getFilterValue() as Array<string> | undefined) ?? []
  const universities = [...(column?.getFacetedUniqueValues().keys() ?? [])].sort()

  const rows = table.getFilteredRowModel().rows
  const universityCount = new Set(rows.map((row) => row.original.university)).size

  const toggle = (university: string) => {
    const next = selected.includes(university)
      ? selected.filter((value) => value !== university)
      : [...selected, university]
    column?.setFilterValue(next.length > 0 ? next : undefined)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {universities.map((university) => (
          <Button
            key={university}
            onClick={() => toggle(university)}
            size="sm"
            variant={selected.includes(university) ? "button-charcoal" : "button-transparent"}
          >
            {university}
          </Button>
        ))}
        <Badge className="ml-auto" variant="ghost">
          {rows.length} courses · {universityCount} universities
        </Badge>
      </div>
      <DataTable {...args} table={table} />
    </div>
  )
}
WithExternalFilters.args = { density: "compact" } satisfies StoryArgs
