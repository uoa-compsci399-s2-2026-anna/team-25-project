import { createColumnHelper } from "@tanstack/react-table"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { SortableHeader } from "./cells"
import { DataTable } from "./data-table"
import type { DataTableFeatures } from "./data-table-features"
import { useDataTable } from "./hooks/use-data-table"
import type { TableVariantProps } from "./table"

interface Course {
  title: string
  university: string
  students: number
}

const courses: Array<Course> = [
  { title: "COMP 693", university: "Auckland", students: 180 },
  { title: "ENGR 302", university: "Victoria", students: 64 },
  { title: "CS 399", university: "Canterbury", students: 128 },
  { title: "SOFTENG 700", university: "Auckland", students: 96 },
]

const helper = createColumnHelper<DataTableFeatures, Course>()

const columns = helper.columns([
  helper.accessor("title", { header: "Course" }),
  helper.accessor("university", { header: "University", filterFn: "arrHas" }),
  helper.accessor("students", {
    header: ({ column }) => <SortableHeader column={column}>Students</SortableHeader>,
    meta: { cellClassName: "text-right" },
  }),
])

// A group over two of the three columns, so the ungrouped one produces a
// placeholder header on the second header row.
const groupedColumns = helper.columns([
  helper.group({
    header: "Course",
    columns: helper.columns([
      helper.accessor("title", { header: "Title" }),
      helper.accessor("university", { header: "University" }),
    ]),
  }),
  helper.accessor("students", { header: "Students" }),
])

function Harness({
  data = courses,
  pageSize,
  ...props
}: { data?: Array<Course>; pageSize?: number; emptyMessage?: string } & TableVariantProps) {
  const table = useDataTable({
    columns,
    data,
    initialState: pageSize ? { pagination: { pageIndex: 0, pageSize } } : undefined,
  })
  const universities = [
    ...(table.getColumn("university")?.getFacetedUniqueValues().keys() ?? []),
  ].sort()

  return (
    <div>
      {universities.map((university) => (
        <button
          key={university}
          onClick={() => table.getColumn("university")?.setFilterValue([university])}
          type="button"
        >
          {university}
        </button>
      ))}
      <button
        onClick={() => table.getColumn("university")?.setFilterValue(undefined)}
        type="button"
      >
        Clear
      </button>
      <DataTable table={table} {...props} />
    </div>
  )
}

function GroupedHarness({ data = courses }: { data?: Array<Course> }) {
  const table = useDataTable({ columns: groupedColumns, data })
  return <DataTable table={table} />
}

const bodyRows = () => within(screen.getAllByRole("rowgroup")[1]).queryAllByRole("row")
const columnText = (index: number) =>
  bodyRows().map((row) => within(row).getAllByRole("cell")[index].textContent)

describe("DataTable", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders every row by default", () => {
    render(<Harness />)
    expect(bodyRows()).toHaveLength(4)
  })

  it("renders the empty message when there are no rows", () => {
    render(<Harness data={[]} />)
    expect(screen.getByText("No results.")).toBeInTheDocument()
  })

  it("builds facet options from the data", () => {
    render(<Harness />)
    expect(screen.getByRole("button", { name: "Auckland" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Victoria" })).toBeInTheDocument()
  })

  it("keeps rows matching a multi-select filter on a scalar column", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: "Auckland" }))
    expect(columnText(1)).toEqual(["Auckland", "Auckland"])
  })

  it("restores every row when the filter is cleared", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: "Victoria" }))
    expect(bodyRows()).toHaveLength(1)
    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    expect(bodyRows()).toHaveLength(4)
  })

  // Numeric columns sort descending on the first click: TanStack sets
  // `sortDescFirst` from the column type.
  it("sorts when a sortable header is clicked", () => {
    render(<Harness />)
    const header = screen.getByRole("button", { name: "Sort by Students" })
    fireEvent.click(header)
    expect(columnText(2)).toEqual(["180", "128", "96", "64"])
    fireEvent.click(header)
    expect(columnText(2)).toEqual(["64", "96", "128", "180"])
  })

  it("reports the sort direction on the header cell", () => {
    render(<Harness />)
    const trigger = screen.getByRole("button", { name: "Sort by Students" })
    const cell = trigger.closest("th")
    expect(cell).not.toHaveAttribute("aria-sort")
    fireEvent.click(trigger)
    expect(cell).toHaveAttribute("aria-sort", "descending")
    fireEvent.click(trigger)
    expect(cell).toHaveAttribute("aria-sort", "ascending")
  })

  it("uses a custom empty message", () => {
    render(<Harness data={[]} emptyMessage="No courses yet." />)
    expect(screen.getByText("No courses yet.")).toBeInTheDocument()
  })

  it("spans the empty row across every column", () => {
    render(<Harness data={[]} />)
    expect(screen.getByRole("cell")).toHaveAttribute("colspan", String(columns.length))
  })

  it("spans the empty row across every leaf column when columns are grouped", () => {
    render(<GroupedHarness data={[]} />)
    expect(screen.getByRole("cell")).toHaveAttribute("colspan", "3")
  })

  it("applies the column meta className to every cell in the column", () => {
    render(<Harness />)
    for (const row of bodyRows()) {
      expect(within(row).getAllByRole("cell")[2]).toHaveClass("text-right")
    }
  })

  it("forwards the table variant props to the container", () => {
    const { container } = render(<Harness density="compact" striped />)
    const wrapper = container.querySelector("[data-slot=table-container]")
    expect(wrapper).toHaveAttribute("data-striped", "true")
    expect(wrapper).toHaveAttribute("data-density", "compact")
  })

  it("renders a header row per group and leaves placeholder headers empty", () => {
    render(<GroupedHarness />)
    const headerRows = within(screen.getAllByRole("rowgroup")[0]).getAllByRole("row")
    expect(headerRows).toHaveLength(2)
    expect(within(headerRows[0]).getAllByRole("columnheader")[0]).toHaveAttribute("colspan", "2")
    // The ungrouped `students` column has no group above it, so TanStack marks
    // its cell on the first row a placeholder and `DataTable` renders nothing.
    expect(within(headerRows[0]).getAllByRole("columnheader")[1]).toBeEmptyDOMElement()
    expect(within(headerRows[1]).getAllByRole("columnheader")[2]).toHaveTextContent("Students")
  })

  it("shows only the first page when initialState sets a page size", () => {
    render(<Harness pageSize={2} />)
    expect(bodyRows()).toHaveLength(2)
    expect(columnText(0)).toEqual(["COMP 693", "ENGR 302"])
  })
})
