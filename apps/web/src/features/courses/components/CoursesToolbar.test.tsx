import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { CoursePeriodFilter } from "../courses.format"
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

const NO_PERIOD_FILTER: CoursePeriodFilter = { semester: null, year: null }

// The toolbar only reports period filter changes; applying them across a
// course's offerings is CoursesListClient's job, and is tested there.
function Harness({
  data = courses,
  periodFilter = NO_PERIOD_FILTER,
  onPeriodFilterChange = vi.fn(),
}: {
  data?: Array<CourseTableRow>
  periodFilter?: CoursePeriodFilter
  onPeriodFilterChange?: (filter: CoursePeriodFilter) => void
}) {
  const table = useCoursesTable({ data })
  return (
    <div>
      <CoursesToolbar
        onPeriodFilterChange={onPeriodFilterChange}
        periodFilter={periodFilter}
        rows={data}
        table={table}
      />
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

  it("reports a chosen year to its caller, keeping the semester already set", async () => {
    const user = userEvent.setup()
    const onPeriodFilterChange = vi.fn()
    render(
      <Harness
        onPeriodFilterChange={onPeriodFilterChange}
        periodFilter={{ semester: "Semester 2", year: null }}
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "Year" }))
    await user.click(await screen.findByRole("option", { name: "2025" }))

    expect(onPeriodFilterChange).toHaveBeenCalledWith({ semester: "Semester 2", year: 2025 })
    // Narrowing is left to the caller, so the table itself is untouched.
    expect(bodyRows()).toHaveLength(3)
  })

  it("reports a chosen semester to its caller, keeping the year already set", async () => {
    const user = userEvent.setup()
    const onPeriodFilterChange = vi.fn()
    render(
      <Harness
        onPeriodFilterChange={onPeriodFilterChange}
        periodFilter={{ semester: null, year: 2026 }}
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "Semester" }))
    await user.click(await screen.findByRole("option", { name: "Semester 1" }))

    expect(onPeriodFilterChange).toHaveBeenCalledWith({ semester: "Semester 1", year: 2026 })
  })

  it("shows the period filter it is given", () => {
    render(<Harness periodFilter={{ semester: "Trimester 1", year: 2025 }} />)

    expect(screen.getByRole("combobox", { name: "Semester" })).toHaveTextContent("Trimester 1")
    expect(screen.getByRole("combobox", { name: "Year" })).toHaveTextContent("2025")
  })

  it("offers the semesters and years of every offering, not just the one each row shows", async () => {
    const user = userEvent.setup()
    const withOfferings = [
      {
        ...courses[0],
        offerings: [
          { offeringId: 2, title: "", lecturer: "", semester: "Semester 2", year: 2026 },
          { offeringId: 1, title: "", lecturer: "", semester: "Full Year", year: 2024 },
        ],
      },
    ]
    render(<Harness data={withOfferings} />)

    await user.click(screen.getByRole("combobox", { name: "Year" }))
    expect(await screen.findByRole("option", { name: "2024" })).toBeInTheDocument()
    await user.keyboard("{Escape}")

    await user.click(screen.getByRole("combobox", { name: "Semester" }))
    expect(await screen.findByRole("option", { name: "Full Year" })).toBeInTheDocument()
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

  // A draft can be saved with a year before its term is settled, or the reverse.
  it("drops each half's placeholder for a draft with only a year or only a term", async () => {
    const user = userEvent.setup()
    const halfSet = [
      ...courses,
      { ...courses[0], id: "4", semester: "—", year: 2031 },
      { ...courses[0], id: "5", semester: "Summer School", year: 0 },
    ]
    render(<Harness data={halfSet} />)

    await user.click(screen.getByRole("combobox", { name: "Year" }))
    expect(await screen.findByRole("option", { name: "2031" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "0" })).not.toBeInTheDocument()
    await user.keyboard("{Escape}")

    await user.click(screen.getByRole("combobox", { name: "Semester" }))
    expect(await screen.findByRole("option", { name: "Summer School" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "—" })).not.toBeInTheDocument()
  })
})
