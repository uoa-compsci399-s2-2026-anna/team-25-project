import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getCourseResourcesCached } from "../resources.queries"
import { COURSE_RESOURCES_SHOWN, CourseResources, CourseResourcesSkeleton } from "./CourseResources"

vi.mock("../resources.queries", () => ({ getCourseResourcesCached: vi.fn() }))
// Signed out unless a test says otherwise, so no Edit/Delete menus.
vi.mock("@/lib/payload/getCurrentUser", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ collection: null, user: null }),
}))
const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }))
vi.mock("../actions/deleteResource", () => ({ deleteResource: vi.fn() }))

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

  it("gives the owner the Edit/Delete menu, whose Edit opens the resource's editor", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      collection: "members",
      user: { id: 7 },
    } as never)
    await renderSection([resource(18, "Contribution rubric")])

    fireEvent.click(screen.getByRole("button", { name: "Actions for Contribution rubric" }))
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }))

    expect(push).toHaveBeenCalledWith("/resources/18#edit")
  })

  it.each([
    ["another member's resource", { collection: "members", user: { id: 8 } }],
    // Admins manage resources from the admin dashboard - and their ids are their own,
    // so one matching the owner's is no claim to it.
    ["an admin's view, even one sharing the owner's id", { collection: "admin", user: { id: 7 } }],
  ])("has no Edit/Delete menu on %s", async (_, current) => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(current as never)
    await renderSection([resource(18, "Contribution rubric")])

    expect(screen.queryByRole("button", { name: /^Actions for / })).not.toBeInTheDocument()
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
