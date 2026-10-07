import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCourseResourcesCached } from "../resources.queries"
import { COURSE_RESOURCES_SHOWN, CourseResources, CourseResourcesSkeleton } from "./CourseResources"

vi.mock("../resources.queries", () => ({ getCourseResourcesCached: vi.fn() }))

const description = (text: string) => ({
  root: {
    children: [
      {
        children: [
          { detail: 0, format: 0, mode: "normal", style: "", text, type: "text", version: 1 },
        ],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
})

const resource = (id: number, title: string) => ({
  createdAt: "2026-06-03T00:00:00.000Z",
  description: description(`${title} notes.`),
  id,
  owner: { firstName: "Anna", id: 7, lastName: "Tui" },
  title,
})

type CourseResourcesResult = Awaited<ReturnType<typeof getCourseResourcesCached>>

const renderSection = async (
  resources: ReturnType<typeof resource>[],
  total = resources.length,
) => {
  vi.mocked(getCourseResourcesCached).mockResolvedValue({
    resources,
    total,
  } as unknown as CourseResourcesResult)
  render(await CourseResources({ params: Promise.resolve({ courseId: "4" }) }))
}

describe("CourseResources", () => {
  afterEach(() => {
    cleanup()
  })

  it("asks for the course's newest resources, up to the number shown", async () => {
    await renderSection([])
    expect(getCourseResourcesCached).toHaveBeenCalledWith(4, COURSE_RESOURCES_SHOWN)
  })

  it("lists each resource as a card linking to it, without the course badge", async () => {
    await renderSection([resource(18, "Contribution rubric")])

    expect(screen.getByText("Resources - 1")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Contribution rubric" })).toHaveAttribute(
      "href",
      "/resources/18",
    )
    expect(screen.getByText("Contribution rubric notes.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Shared by Anna Tui/ })).toHaveAttribute(
      "href",
      "/members/7",
    )
    expect(document.querySelector("[data-slot=badge]")).not.toBeInTheDocument()
  })

  it("links to the course's filtered resources list when there are more than shown", async () => {
    await renderSection([resource(18, "Contribution rubric")], 8)

    expect(screen.getByText("Resources - 8")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View all 8 resources" })).toHaveAttribute(
      "href",
      "/resources?course=4",
    )
  })

  it("has no view-all link when every resource is shown", async () => {
    await renderSection([resource(18, "Contribution rubric")])
    expect(screen.queryByRole("link", { name: /View all/ })).not.toBeInTheDocument()
  })

  it("says so when no resource is linked to the course", async () => {
    await renderSection([])

    expect(screen.getByText("Resources - 0")).toBeInTheDocument()
    expect(screen.getByText("No resources are linked to this course yet.")).toBeInTheDocument()
  })
})

describe("CourseResourcesSkeleton", () => {
  it("renders two placeholder cards", () => {
    const { container } = render(<CourseResourcesSkeleton />)
    expect(container.querySelectorAll('[data-slot="resource-card-skeleton"]')).toHaveLength(2)
    cleanup()
  })
})
