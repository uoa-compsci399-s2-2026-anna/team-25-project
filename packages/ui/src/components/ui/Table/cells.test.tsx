import { createColumnHelper } from "@tanstack/react-table"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { BadgeCell, cellVariants, SortableHeader, StackedCell, TextCell } from "./cells"
import { DataTable } from "./data-table"
import type { DataTableFeatures } from "./data-table-features"
import { useDataTable } from "./hooks/use-data-table"

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot=${name}]`)

describe("TextCell", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders its children in a span with the default tone and alignment", () => {
    const { container } = render(<TextCell>CS 399</TextCell>)
    const cell = slot(container, "table-text-cell")
    expect(cell).toHaveTextContent("CS 399")
    expect(cell?.tagName).toBe("SPAN")
    expect(cell).toHaveClass("text-foreground", "text-left")
  })

  it("applies the muted tone and the end alignment", () => {
    const { container } = render(
      <TextCell align="end" tone="muted">
        180
      </TextCell>,
    )
    expect(slot(container, "table-text-cell")).toHaveClass("text-muted-foreground", "text-right")
  })

  it("merges a custom className and forwards extra props", () => {
    const { container } = render(
      <TextCell className="text-cn" title="Course">
        CS 399
      </TextCell>,
    )
    const cell = slot(container, "table-text-cell")
    expect(cell).toHaveClass("text-cn")
    expect(cell).toHaveAttribute("title", "Course")
  })
})

describe("StackedCell", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the primary value and the muted secondary value", () => {
    const { container } = render(<StackedCell primary="CS 399" secondary="Canterbury" />)
    const cell = slot(container, "table-stacked-cell")
    expect(cell).toHaveTextContent("CS 399")
    expect(cell?.firstElementChild).toHaveClass("font-semibold")
    expect(cell?.lastElementChild).toHaveClass("text-muted-foreground")
    expect(cell?.lastElementChild).toHaveTextContent("Canterbury")
  })

  it("omits the secondary line when there is no secondary value", () => {
    const { container } = render(<StackedCell primary="CS 399" />)
    const cell = slot(container, "table-stacked-cell")
    expect(cell?.children).toHaveLength(1)
  })

  it("defaults data-align to start and reports the chosen alignment", () => {
    const { container: start } = render(<StackedCell primary="CS 399" />)
    expect(slot(start, "table-stacked-cell")).toHaveAttribute("data-align", "start")
    const { container: end } = render(<StackedCell align="end" primary="CS 399" />)
    const cell = slot(end, "table-stacked-cell")
    expect(cell).toHaveAttribute("data-align", "end")
    expect(cell).toHaveClass("items-end", "text-right")
  })

  it("merges a custom className and forwards extra props", () => {
    const { container } = render(
      <StackedCell className="stacked-cn" primary="CS 399" title="Course" />,
    )
    const cell = slot(container, "table-stacked-cell")
    expect(cell).toHaveClass("stacked-cn")
    expect(cell).toHaveAttribute("title", "Course")
  })
})

describe("BadgeCell", () => {
  afterEach(() => {
    cleanup()
  })

  it("defaults to the pink badge variant", () => {
    const { container } = render(<BadgeCell>Enrolled</BadgeCell>)
    const cell = slot(container, "table-badge-cell")
    expect(cell).toHaveTextContent("Enrolled")
    expect(cell).toHaveAttribute("data-variant", "pink")
  })

  it("accepts another badge variant", () => {
    const { container } = render(<BadgeCell variant="blue">Waitlisted</BadgeCell>)
    expect(slot(container, "table-badge-cell")).toHaveAttribute("data-variant", "blue")
  })
})

interface Course {
  title: string
  students: number
}

const courses: Array<Course> = [
  { title: "CS 399", students: 128 },
  { title: "ENGR 302", students: 64 },
]

const helper = createColumnHelper<DataTableFeatures, Course>()

const columns = helper.columns([
  helper.accessor("title", {
    enableSorting: false,
    header: ({ column }) => <SortableHeader column={column}>Course</SortableHeader>,
  }),
  helper.accessor("students", {
    header: ({ column }) => (
      <SortableHeader className="header-cn" column={column}>
        Students
      </SortableHeader>
    ),
  }),
])

function Harness() {
  const table = useDataTable({ columns, data: courses })
  return <DataTable table={table} />
}

describe("SortableHeader", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders plain text with no button when the column cannot sort", () => {
    render(<Harness />)
    expect(screen.getByRole("columnheader", { name: "Course" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Sort by Course" })).not.toBeInTheDocument()
  })

  it("labels the trigger with the header text and merges a custom className", () => {
    render(<Harness />)
    const trigger = screen.getByRole("button", { name: "Sort by Students" })
    expect(trigger).toHaveAttribute("type", "button")
    expect(trigger).toHaveClass("header-cn")
  })

  it("shows the neutral icon while unsorted, then the direction icons as it toggles", () => {
    render(<Harness />)
    const trigger = screen.getByRole("button", { name: "Sort by Students" })
    const icon = () => trigger.querySelector("svg")
    expect(icon()).toHaveClass("text-muted-foreground/60")

    fireEvent.click(trigger)
    expect(icon()).toHaveClass("text-foreground")
    const descending = icon()?.outerHTML

    fireEvent.click(trigger)
    expect(icon()).toHaveClass("text-foreground")
    expect(icon()?.outerHTML).not.toBe(descending)
  })

  it("falls back to the column id in the label when the header is not a string", () => {
    const idColumns = helper.columns([
      helper.accessor("students", { header: () => <span>count</span> }),
    ])
    function IdHarness() {
      const table = useDataTable({ columns: idColumns, data: courses })
      const column = table.getColumn("students")
      if (!column) {
        throw new Error("missing column")
      }
      return (
        <SortableHeader column={column}>
          <span>Students</span>
        </SortableHeader>
      )
    }
    render(<IdHarness />)
    expect(screen.getByRole("button", { name: "Sort by students" })).toBeInTheDocument()
  })
})

describe("cellVariants", () => {
  it("keeps the card hover rule on the sort trigger", () => {
    expect(cellVariants.sortTrigger()).toContain("hover:bg-brand-blush")
  })

  it("marks the sort icon as unsorted by default", () => {
    expect(cellVariants.sortIcon()).toBe(cellVariants.sortIcon({ sorted: false }))
  })
})
