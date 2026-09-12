import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"
import { tableVariants } from "./table.variants"

function renderTable(props?: React.ComponentProps<typeof Table>) {
  return render(
    <Table {...props}>
      <TableCaption>Enrolled courses</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Course</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>CS 399</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>1 course</TableCell>
        </TableRow>
      </TableFooter>
    </Table>,
  )
}

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot=${name}]`)

describe("Table", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders every part with its slot", () => {
    const { container } = renderTable()
    for (const name of [
      "table-container",
      "table",
      "table-caption",
      "table-header",
      "table-body",
      "table-footer",
      "table-row",
      "table-head",
      "table-cell",
    ]) {
      expect(slot(container, name)).toBeInTheDocument()
    }
    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Course" })).toBeInTheDocument()
    expect(screen.getByRole("cell", { name: "CS 399" })).toBeInTheDocument()
  })

  it("wraps the table in a container that owns the variant data attributes", () => {
    const { container } = renderTable()
    const wrapper = slot(container, "table-container")
    expect(wrapper).toHaveAttribute("data-density", "comfortable")
    expect(wrapper).toHaveAttribute("data-striped", "false")
    expect(wrapper).toHaveClass(
      "group/table",
      "overflow-x-auto",
      "rounded-4xl",
      "bg-brand-blush/30",
    )
    expect(wrapper).toContainElement(screen.getByRole("table"))
  })

  it("publishes the compact density and the striped flag", () => {
    const { container } = renderTable({ density: "compact", striped: true })
    const wrapper = slot(container, "table-container")
    expect(wrapper).toHaveAttribute("data-density", "compact")
    expect(wrapper).toHaveAttribute("data-striped", "true")
  })

  it("merges a custom className on each part and on the container", () => {
    const { container } = render(
      <Table className="table-cn" containerClassName="container-cn">
        <TableCaption className="caption-cn">Caption</TableCaption>
        <TableHeader className="header-cn">
          <TableRow className="row-cn">
            <TableHead className="head-cn">Course</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="body-cn">
          <TableRow>
            <TableCell className="cell-cn">CS 399</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter className="footer-cn">
          <TableRow>
            <TableCell>1 course</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    )
    expect(slot(container, "table-container")).toHaveClass("container-cn")
    expect(slot(container, "table")).toHaveClass("table-cn")
    expect(slot(container, "table-caption")).toHaveClass("caption-cn")
    expect(slot(container, "table-header")).toHaveClass("header-cn")
    expect(slot(container, "table-body")).toHaveClass("body-cn")
    expect(slot(container, "table-footer")).toHaveClass("footer-cn")
    expect(slot(container, "table-row")).toHaveClass("row-cn")
    expect(slot(container, "table-head")).toHaveClass("head-cn")
    expect(slot(container, "table-cell")).toHaveClass("cell-cn")
  })

  it("forwards extra props to the underlying elements", () => {
    render(
      <Table aria-label="Courses" data-testid="courses">
        <TableBody>
          <TableRow data-state="selected">
            <TableCell colSpan={2}>CS 399</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )
    const table = screen.getByRole("table", { name: "Courses" })
    expect(table).toHaveAttribute("data-testid", "courses")
    expect(screen.getByRole("row")).toHaveAttribute("data-state", "selected")
    expect(screen.getByRole("cell")).toHaveAttribute("colspan", "2")
  })
})

describe("tableVariants", () => {
  it("falls back to the default variants when none are given", () => {
    expect(tableVariants.container()).toBe(tableVariants.container({}))
  })

  it("keeps the density rule and the card padding on the cell part", () => {
    expect(tableVariants.cell()).toContain("group-data-[density=compact]/table:py-1.5")
    expect(tableVariants.cell()).toContain("px-6")
  })

  it("keeps the striped rule on the row part", () => {
    expect(tableVariants.row()).toContain("group-data-[striped=true]/table:even:bg-muted/30")
  })
})
