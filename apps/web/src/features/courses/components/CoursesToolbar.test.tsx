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
    currentOffering: "Semester 2 2026",
    currentStartDate: "2026-07-20",
    offerings: 1,
    status: "published",
  },
  {
    id: "2",
    code: "SOFTENG 700",
    title: "Research Project",
    lecturer: "M. Rahman",
    university: "University of Auckland",
    currentOffering: "Semester 1 2027",
    currentStartDate: "2027-03-02",
    offerings: 1,
    status: "draft",
  },
  {
    id: "3",
    code: "ENGR 302",
    title: "Team Project",
    lecturer: "K. Whitfield",
    university: "Victoria University",
    currentOffering: "Trimester 1 2025",
    currentStartDate: "2025-03-02",
    offerings: 1,
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
    await user.click(await screen.findByRole("option", { name: "Current offering: Oldest first" }))

    const offerings = bodyRows().map((row) => within(row).getAllByRole("cell")[2].textContent)
    expect(offerings).toEqual(["Trimester 1 2025", "Semester 2 2026", "Semester 1 2027"])
  })

  it("keeps the sort dropdown in sync when a column header is clicked instead", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Sort by Current offering" }))

    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveTextContent(
      "Current offering: Newest first",
    )
  })
})
