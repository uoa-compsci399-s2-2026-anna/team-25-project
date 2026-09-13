import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CoursesYourEntriesPanel } from "./CoursesYourEntriesPanel"

describe("CoursesYourEntriesPanel", () => {
  it("shows a neutral message when there's nothing to summarize - signed out or signed in as an admin", () => {
    render(<CoursesYourEntriesPanel myCourses={null} />)
    expect(
      screen.getByText("This panel tracks a signed-in convenor's own courses."),
    ).toBeInTheDocument()
  })

  it("tells a convenor with no courses yet", () => {
    render(<CoursesYourEntriesPanel myCourses={{ total: 0, upToDate: 0, year: 2026 }} />)
    expect(screen.getByText("You don't convene any courses yet.")).toBeInTheDocument()
  })

  it("says 'Both are up to date' when every course is", () => {
    render(<CoursesYourEntriesPanel myCourses={{ total: 2, upToDate: 2, year: 2026 }} />)
    expect(
      screen.getByText("You convene 2 courses. Both are up to date for 2026."),
    ).toBeInTheDocument()
    expect(screen.getByText("Manage your courses →")).toBeInTheDocument()
  })

  it("uses singular phrasing for exactly one course", () => {
    render(<CoursesYourEntriesPanel myCourses={{ total: 1, upToDate: 1, year: 2026 }} />)
    expect(screen.getByText("You convene 1 course. It's up to date for 2026.")).toBeInTheDocument()
  })

  it("says 'All are up to date' for more than two", () => {
    render(<CoursesYourEntriesPanel myCourses={{ total: 3, upToDate: 3, year: 2026 }} />)
    expect(
      screen.getByText("You convene 3 courses. All are up to date for 2026."),
    ).toBeInTheDocument()
  })

  it("counts out how many are behind when not all are up to date", () => {
    render(<CoursesYourEntriesPanel myCourses={{ total: 2, upToDate: 1, year: 2026 }} />)
    expect(
      screen.getByText("You convene 2 courses. 1 of 2 is up to date for 2026."),
    ).toBeInTheDocument()
  })
})
