import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { CoursesHeader, CoursesList } from "@/features/courses/components/CoursesList"
import Page from "./page"

vi.mock("@/features/courses/components/CoursesList", () => ({
  CoursesHeader: vi.fn(() => <div>Courses header</div>),
  CoursesHeaderSkeleton: () => null,
  CoursesList: vi.fn(() => <div>Courses list</div>),
  CoursesListSkeleton: () => null,
}))
vi.mock("@/features/courses/components/CoursesPageHeader", () => ({
  CoursesPageHeader: () => null,
}))

describe("courses page", () => {
  it("renders the header and the list as separate sections", () => {
    render(<Page />)

    expect(screen.getByText("Courses header")).toBeInTheDocument()
    expect(screen.getByText("Courses list")).toBeInTheDocument()
    expect(CoursesHeader).toHaveBeenCalled()
    expect(CoursesList).toHaveBeenCalled()
  })
})
