import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { CoursesList } from "@/features/courses/components/CoursesList"
import Page from "./page"

vi.mock("@/features/courses/components/CoursesList", () => ({
  CoursesList: vi.fn(() => <div>Courses list</div>),
}))

describe("courses page", () => {
  it("renders the courses list, which owns the header and its data", () => {
    render(<Page />)

    expect(screen.getByText("Courses list")).toBeInTheDocument()
    expect(CoursesList).toHaveBeenCalled()
  })
})
