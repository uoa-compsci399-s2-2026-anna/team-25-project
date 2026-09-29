import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { CoursesSummaryPanel, CoursesSummaryPanelSkeleton } from "./CoursesSummaryPanel"

afterEach(() => {
  cleanup()
})

describe("CoursesSummaryPanel", () => {
  it("renders each stat as a label/value pair", () => {
    render(
      <CoursesSummaryPanel
        summary={{
          totalCourses: 14,
          yearLongCourses: 6,
          industryRequiredCourses: 5,
          medianTeamSize: 4,
        }}
      />,
    )

    expect(screen.getByText("Summary")).toBeInTheDocument()
    expect(screen.getByText("Year-long courses")).toBeInTheDocument()
    expect(screen.getByText("6 of 14")).toBeInTheDocument()
    expect(screen.getByText("Industry required")).toBeInTheDocument()
    expect(screen.getByText("5 of 14")).toBeInTheDocument()
    expect(screen.getByText("Median team size")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
  })
})

describe("CoursesSummaryPanelSkeleton", () => {
  it("renders the real labels, with a placeholder for each value", () => {
    const { container } = render(<CoursesSummaryPanelSkeleton />)

    expect(screen.getByText("Summary")).toBeInTheDocument()
    expect(screen.getByText("Year-long courses")).toBeInTheDocument()
    expect(screen.getByText("Industry required")).toBeInTheDocument()
    expect(screen.getByText("Median team size")).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3)
  })
})
