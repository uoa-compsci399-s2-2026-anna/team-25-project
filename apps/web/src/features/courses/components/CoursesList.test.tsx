import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { CoursesHeaderSkeleton, CoursesListSkeleton } from "./CoursesList"

// The skeleton never reads data; the queries module is stubbed so it doesn't load Payload.
vi.mock("../courses.queries", () => ({}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

describe("CoursesHeaderSkeleton", () => {
  it("shows the heading and add button, with a placeholder for the export", () => {
    render(<CoursesHeaderSkeleton />)

    expect(screen.getByRole("heading", { level: 1, name: "Capstone courses" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "+ Add your course" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Export CSV" })).not.toBeInTheDocument()
  })
})

describe("CoursesListSkeleton", () => {
  it("lays out the table and Your courses panel as the page does", () => {
    render(<CoursesListSkeleton />)

    expect(screen.getByRole("columnheader", { name: "Course" })).toBeInTheDocument()
    expect(screen.getByText("Your courses")).toBeInTheDocument()
  })
})
