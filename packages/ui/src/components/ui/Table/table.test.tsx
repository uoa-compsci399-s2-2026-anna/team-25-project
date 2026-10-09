import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
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
      "table-wrapper",
      "table-container",
      "table-card",
      "table-scroll-hint",
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
    expect(wrapper).toHaveClass("group/table", "overflow-x-auto")
    expect(wrapper).toContainElement(screen.getByRole("table"))
  })

  it("puts the card styling inside the scroller, so it scrolls with the columns", () => {
    const { container } = renderTable()
    const card = slot(container, "table-card")
    expect(card).toHaveClass("rounded-4xl", "bg-brand-blush/30", "min-w-full")
    expect(slot(container, "table-container")).toContainElement(card as HTMLElement)
    expect(card).toContainElement(screen.getByRole("table"))
  })

  it("bleeds the scroller through the page padding named by --table-bleed", () => {
    const container = tableVariants.container()
    expect(container).toContain("mx-[calc(var(--table-bleed,0px)*-1)]")
    // Pads back in by --table-inset when set, otherwise by the full bleed.
    expect(container).toContain("px-[var(--table-inset,var(--table-bleed,0px))]")
  })

  it("hides the scroll hint from screen readers and from wide screens", () => {
    const { container } = renderTable()
    const hint = slot(container, "table-scroll-hint")
    expect(hint).toHaveAttribute("aria-hidden", "true")
    expect(hint).toHaveTextContent("Scroll for more")
    expect(hint).toHaveClass("md:hidden", "opacity-0")
    // Shown through the wrapper only while columns are hidden past the right edge.
    expect(tableVariants.hint()).toContain(
      "group-has-[[data-overflow-end=true]]/table-wrapper:opacity-100",
    )
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

describe("Table scroll overflow", () => {
  afterEach(() => {
    cleanup()
  })

  // jsdom does no layout, so the scroll metrics are stubbed onto the container.
  const stubScroll = (element: Element, metrics: Record<string, number>) => {
    for (const [key, value] of Object.entries(metrics)) {
      Object.defineProperty(element, key, { configurable: true, value })
    }
  }

  it("flags no hidden content when the table fits", () => {
    const { container } = renderTable()
    const wrapper = slot(container, "table-container")
    expect(wrapper).toHaveAttribute("data-overflow-start", "false")
    expect(wrapper).toHaveAttribute("data-overflow-end", "false")
  })

  it("flags the edge that has columns past it as the table scrolls", () => {
    const { container } = renderTable()
    const wrapper = slot(container, "table-container") as HTMLElement

    stubScroll(wrapper, { clientWidth: 300, scrollLeft: 0, scrollWidth: 600 })
    act(() => {
      fireEvent.scroll(wrapper)
    })
    expect(wrapper).toHaveAttribute("data-overflow-start", "false")
    expect(wrapper).toHaveAttribute("data-overflow-end", "true")

    stubScroll(wrapper, { scrollLeft: 150 })
    act(() => {
      fireEvent.scroll(wrapper)
    })
    expect(wrapper).toHaveAttribute("data-overflow-start", "true")
    expect(wrapper).toHaveAttribute("data-overflow-end", "true")

    stubScroll(wrapper, { scrollLeft: 300 })
    act(() => {
      fireEvent.scroll(wrapper)
    })
    expect(wrapper).toHaveAttribute("data-overflow-start", "true")
    expect(wrapper).toHaveAttribute("data-overflow-end", "false")
  })

  it("names the scroller as a region, from scrollLabel or a default", () => {
    renderTable()
    expect(screen.getByRole("region", { name: "Table" })).toBeInTheDocument()
    cleanup()
    renderTable({ scrollLabel: "Courses" })
    expect(screen.getByRole("region", { name: "Courses" })).toBeInTheDocument()
  })

  it("is a tab stop only while there is something to scroll", () => {
    const { container } = renderTable()
    const wrapper = slot(container, "table-container") as HTMLElement
    expect(wrapper).not.toHaveAttribute("tabindex")

    stubScroll(wrapper, { clientWidth: 300, scrollLeft: 0, scrollWidth: 600 })
    act(() => {
      fireEvent.scroll(wrapper)
    })
    expect(wrapper).toHaveAttribute("tabindex", "0")
  })

  it("draws the focus ring on the card, inside the edge fade", () => {
    expect(tableVariants.container()).toContain("outline-none")
    expect(tableVariants.card()).toContain("group-focus-visible/table:outline-ring/50")
    expect(tableVariants.card()).toContain("group-focus-visible/table:-outline-offset-[3px]")
  })

  it("only fades an edge while it is flagged", () => {
    const container = tableVariants.container()
    expect(container).toContain("data-[overflow-end=true]:[--fade-end:3rem]")
    expect(container).toContain("data-[overflow-start=true]:[--fade-start:3rem]")
    expect(container).toContain("[--fade-end:0px]")
    expect(container).toContain("[--fade-start:0px]")
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
