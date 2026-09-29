import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { CoursesListSkeleton } from "./CoursesList"

// The skeleton never reads data; the queries module is stubbed so it doesn't load Payload.
vi.mock("../courses.queries", () => ({}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

describe("CoursesListSkeleton", () => {
  it("lays out the header, table and both panels as the page does", () => {
    render(<CoursesListSkeleton />)

    expect(screen.getByRole("heading", { level: 1, name: "Capstone courses" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Course" })).toBeInTheDocument()
    expect(screen.getByText("Summary")).toBeInTheDocument()
    expect(screen.getByText("Your entries")).toBeInTheDocument()
  })
})
