import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CoursesSummaryPanel } from "./CoursesSummaryPanel"

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
