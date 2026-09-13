import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CoursesPageHeader } from "./CoursesPageHeader"
import type { CourseTableRow } from "./CoursesTable"

const rows: Array<CourseTableRow> = [
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
]

describe("CoursesPageHeader", () => {
  it("renders the page title, description, and the export/add-course buttons", () => {
    render(<CoursesPageHeader rows={rows} />)

    expect(screen.getByRole("heading", { level: 1, name: "Capstone courses" })).toBeInTheDocument()
    expect(screen.getByText(/how each institution structures its capstone/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "+ Add your course" })).toBeInTheDocument()
  })
})
