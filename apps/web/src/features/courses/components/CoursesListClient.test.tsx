import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CoursesListClient } from "./CoursesListClient"
import type { CourseTableRow } from "./CoursesTable"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

const rows: Array<CourseTableRow> = Array.from({ length: 15 }, (_, index) => ({
  id: String(index + 1),
  code: `COMP ${600 + index}`,
  title: "Capstone Project",
  lecturer: "A. Tui",
  university: "University of Auckland",
  semester: "Semester 2",
  year: 2026,
  status: "published",
}))

describe("CoursesListClient", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows every row up front, with no pagination limiting the table", () => {
    render(<CoursesListClient rows={rows} />)

    const bodyRows = within(screen.getAllByRole("rowgroup")[1]).getAllByRole("row")
    expect(bodyRows).toHaveLength(15)
  })

  it("renders the toolbar wired to the same table as the list", () => {
    render(<CoursesListClient rows={rows} />)

    expect(screen.getByRole("searchbox", { name: "Search courses..." })).toBeInTheDocument()
  })

  it("shows the empty message when no courses are passed in", () => {
    render(<CoursesListClient rows={[]} />)

    expect(screen.getByText("No courses match these filters.")).toBeInTheDocument()
  })
})
