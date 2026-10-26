import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import type { MyCourse } from "../courses.format"
import { YourCoursesPanel } from "./YourCoursesPanel"

afterEach(() => {
  cleanup()
})

const myCourse = (overrides: Partial<MyCourse> = {}): MyCourse => ({
  courseId: 7,
  code: "COMPSCI 399",
  title: "Capstone",
  isOwner: true,
  isEditor: false,
  currentOffering: "Semester 2 2026",
  needsOfferingThisYear: false,
  lastOfferingBeforeYear: null,
  taughtOfferings: [],
  ...overrides,
})

const renderPanel = (courses: MyCourse[]) =>
  render(<YourCoursesPanel myCourses={{ year: 2026, courses }} />)

describe("YourCoursesPanel", () => {
  it("renders nothing without a member or any courses", () => {
    expect(render(<YourCoursesPanel myCourses={null} />).container).toBeEmptyDOMElement()
    expect(renderPanel([]).container).toBeEmptyDOMElement()
  })

  it("links each course and badges the viewer's relation to it", () => {
    renderPanel([
      myCourse({
        isOwner: false,
        isEditor: true,
        taughtOfferings: [{ id: 3, period: "Semester 2 2026" }],
      }),
    ])

    expect(screen.getByText("Your courses")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "COMPSCI 399 Capstone" })).toHaveAttribute(
      "href",
      "/courses/7",
    )
    expect(screen.getByText("Editor", { selector: "[data-slot=badge]" })).toBeInTheDocument()
    expect(screen.queryByText("Taught", { selector: "[data-slot=badge]" })).not.toBeInTheDocument()
    expect(screen.queryByText("Owner", { selector: "[data-slot=badge]" })).not.toBeInTheDocument()
  })

  it("says how many owned courses need updating", () => {
    renderPanel([
      myCourse({ courseId: 1, needsOfferingThisYear: true }),
      myCourse({ courseId: 2 }),
      myCourse({ courseId: 3 }),
      myCourse({ courseId: 4, isOwner: false, isEditor: true }),
    ])
    expect(screen.getByText("You own 3 courses. 1 needs updating.")).toBeInTheDocument()
  })

  it("says when every owned course is up to date, and leaves it out when the viewer owns nothing", () => {
    renderPanel([myCourse({ courseId: 1 }), myCourse({ courseId: 2 })])
    expect(screen.getByText("You own 2 courses, and all are up to date.")).toBeInTheDocument()

    cleanup()
    renderPanel([myCourse()])
    expect(screen.getByText("You own 1 course, and it's up to date.")).toBeInTheDocument()

    cleanup()
    renderPanel([myCourse({ isOwner: false, isEditor: true })])
    expect(screen.queryByText(/You own/)).not.toBeInTheDocument()
  })

  it("flags an owned course that needs an offering for the year", () => {
    renderPanel([
      myCourse({ needsOfferingThisYear: true, lastOfferingBeforeYear: "Semester 2 2025" }),
    ])
    expect(screen.getByText("Needs a 2026 offering · last Semester 2 2025")).toBeInTheDocument()
  })

  it("links up to two taught offerings and counts the rest", () => {
    renderPanel([
      myCourse({
        taughtOfferings: [
          { id: 3, period: "Semester 2 2026" },
          { id: 2, period: "Semester 2 2025" },
          { id: 1, period: "Semester 2 2024" },
        ],
      }),
    ])

    expect(screen.getByRole("link", { name: "Semester 2 2026" })).toHaveAttribute(
      "href",
      "/courses/7?offering=3",
    )
    expect(screen.getByRole("link", { name: "Semester 2 2025" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Semester 2 2024" })).not.toBeInTheDocument()
    expect(screen.getByText("+1", { exact: false })).toBeInTheDocument()
  })
})
