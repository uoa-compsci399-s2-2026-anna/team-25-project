import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CoursesTable, type CourseTableRow, useCoursesTable } from "./CoursesTable"
import { CoursesToolbar } from "./CoursesToolbar"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

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

function Harness({ data = courses }: { data?: Array<CourseTableRow> }) {
  const table = useCoursesTable({ data })
  return (
    <div>
      <CoursesToolbar rows={data} table={table} />
      <CoursesTable table={table} />
    </div>
  )
}

const bodyRows = () => within(screen.getAllByRole("rowgroup")[1]).queryAllByRole("row")

describe("CoursesToolbar", () => {
  afterEach(() => {
    cleanup()
  })

  it("narrows rows as the search box is typed into", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole("searchbox", { name: "Search courses..." }), "softeng")

    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByText("SOFTENG 700 Research Project")).toBeInTheDocument()
  })

  it("narrows rows by university", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("combobox", { name: "University" }))
    await user.click(await screen.findByRole("option", { name: "Victoria University" }))

    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByText("ENGR 302 Team Project")).toBeInTheDocument()
  })

  it("narrows rows by year", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("combobox", { name: "Year" }))
    await user.click(await screen.findByRole("option", { name: "2025" }))

    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByText("ENGR 302 Team Project")).toBeInTheDocument()
  })

  it("narrows rows by status tab, with counts for each tab", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByRole("tab", { name: "Draft - 1" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Published - 2" })).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Draft - 1" }))

    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByText("SOFTENG 700 Research Project")).toBeInTheDocument()
  })

  it("sorts by the chosen preset", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("combobox", { name: "Sort" }))
    await user.click(await screen.findByRole("option", { name: "Year: Oldest first" }))

    const years = bodyRows().map((row) => within(row).getAllByRole("cell")[3].textContent)
    expect(years).toEqual(["2025", "2026", "2027"])
  })

  it("keeps the sort dropdown in sync when a column header is clicked instead", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Sort by Year" }))

    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveTextContent("Year: Newest first")
  })

  it("excludes the no-offering-yet placeholder from the Year and Semester filter options", async () => {
    const user = userEvent.setup()
    const withPlaceholder = [...courses, { ...courses[0], id: "4", semester: "—", year: 0 }]
    render(<Harness data={withPlaceholder} />)

    await user.click(screen.getByRole("combobox", { name: "Year" }))
    expect(screen.queryByRole("option", { name: "0" })).not.toBeInTheDocument()
    await user.keyboard("{Escape}")

    await user.click(screen.getByRole("combobox", { name: "Semester" }))
    expect(screen.queryByRole("option", { name: "—" })).not.toBeInTheDocument()
  })
})
