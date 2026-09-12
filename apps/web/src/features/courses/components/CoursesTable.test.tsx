import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CoursesTable, type CourseTableRow, useCoursesTable } from "./CoursesTable"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const courses: Array<CourseTableRow> = [
  {
    id: "1",
    code: "COMP 693",
    title: "Capstone Project",
    lecturer: "A. Tui",
    university: "University of Auckland",
    semester: "Semester 2",
    year: 2026,
    status: "published",
  },
  {
    id: "2",
    code: "SOFTENG 700",
    title: "Research Project",
    lecturer: "M. Rahman",
    university: "University of Auckland",
    semester: "Semester 1",
    year: 2027,
    status: "draft",
  },
  {
    id: "3",
    code: "ENGR 302",
    title: "Team Project",
    lecturer: "K. Whitfield",
    university: "Victoria University",
    semester: "Trimester 1",
    year: 2025,
    status: "published",
  },
]

function Harness({
  data = courses,
  isLoading,
}: {
  data?: Array<CourseTableRow>
  isLoading?: boolean
}) {
  const table = useCoursesTable({ data })

  return (
    <div>
      <button
        onClick={() => table.getColumn("university")?.setFilterValue(["Victoria University"])}
        type="button"
      >
        Filter Victoria
      </button>
      <button
        onClick={() => table.getColumn("university")?.setFilterValue(undefined)}
        type="button"
      >
        Clear filter
      </button>
      <button onClick={() => table.getColumn("course")?.setFilterValue("softeng")} type="button">
        Search softeng
      </button>
      <CoursesTable isLoading={isLoading} table={table} />
    </div>
  )
}

const bodyRows = () => within(screen.getAllByRole("rowgroup")[1]).queryAllByRole("row")

describe("CoursesTable", () => {
  afterEach(() => {
    cleanup()
    push.mockClear()
  })

  it("renders every course row by default", () => {
    render(<Harness />)
    expect(bodyRows()).toHaveLength(3)
    expect(screen.getByText("COMP 693 Capstone Project")).toBeInTheDocument()
    expect(screen.getByText("A. Tui")).toBeInTheDocument()
  })

  it("renders the status badges", () => {
    render(<Harness />)
    expect(screen.getAllByText("Published")).toHaveLength(2)
    expect(screen.getByText("Draft")).toBeInTheDocument()
  })

  it("shows the default empty message when there are no courses", () => {
    render(<Harness data={[]} />)
    expect(screen.getByText("No courses found.")).toBeInTheDocument()
  })

  it("renders a skeleton instead of rows while loading", () => {
    const { container } = render(<Harness isLoading />)
    expect(screen.queryByText("COMP 693 Capstone Project")).not.toBeInTheDocument()
    expect(container.querySelectorAll("[data-slot=skeleton]").length).toBeGreaterThan(0)
  })

  it("keeps the real column headers visible while loading", () => {
    render(<Harness isLoading />)
    expect(screen.getByRole("columnheader", { name: "Course" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "University" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Semester" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Year" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument()
  })

  it("sorts when the year header is clicked", () => {
    render(<Harness />)
    const header = screen.getByRole("button", { name: "Sort by Year" })
    fireEvent.click(header)
    const yearsAfterFirstClick = bodyRows().map(
      (row) => within(row).getAllByRole("cell")[3].textContent,
    )
    expect(yearsAfterFirstClick).toEqual(["2027", "2026", "2025"])
    fireEvent.click(header)
    const yearsAfterSecondClick = bodyRows().map(
      (row) => within(row).getAllByRole("cell")[3].textContent,
    )
    expect(yearsAfterSecondClick).toEqual(["2025", "2026", "2027"])
  })

  it("narrows rows when a categorical filter is applied externally", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: "Filter Victoria" }))
    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByText("ENGR 302 Team Project")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Clear filter" }))
    expect(bodyRows()).toHaveLength(3)
  })

  it("narrows rows when a text search is applied externally to the course column", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: "Search softeng" }))
    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByText("SOFTENG 700 Research Project")).toBeInTheDocument()
  })

  it("renders the course cell as a real link to the course's page", () => {
    render(<Harness />)
    expect(screen.getByRole("link", { name: "COMP 693 Capstone ProjectA. Tui" })).toHaveAttribute(
      "href",
      "/courses/1",
    )
  })

  it("navigates to the course page when a non-link cell in the row is clicked", () => {
    render(<Harness />)
    fireEvent.click(screen.getByText("Semester 2"))
    expect(push).toHaveBeenCalledWith("/courses/1")
  })

  it("shows a pointer cursor on every row", () => {
    render(<Harness />)
    for (const row of bodyRows()) {
      expect(row).toHaveClass("cursor-pointer")
    }
  })

  it("makes every row keyboard-focusable", () => {
    render(<Harness />)
    for (const row of bodyRows()) {
      expect(row).toHaveAttribute("tabindex", "0")
    }
  })

  it("navigates when Enter is pressed while a row is focused", () => {
    render(<Harness />)
    fireEvent.keyDown(bodyRows()[0], { key: "Enter" })
    expect(push).toHaveBeenCalledWith("/courses/1")
  })

  it("navigates when Space is pressed while a row is focused", () => {
    render(<Harness />)
    fireEvent.keyDown(bodyRows()[0], { key: " " })
    expect(push).toHaveBeenCalledWith("/courses/1")
  })

  it("does not double-navigate when Enter is pressed on the real course link", () => {
    render(<Harness />)
    const link = screen.getByRole("link", { name: "COMP 693 Capstone ProjectA. Tui" })
    fireEvent.keyDown(link, { key: "Enter" })
    expect(push).not.toHaveBeenCalled()
  })
})
