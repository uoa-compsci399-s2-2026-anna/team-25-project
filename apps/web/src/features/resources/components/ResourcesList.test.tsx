import type { Resource } from "@repo/shared/payload-types"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { loadResourcesPage } from "../resources.queries"
import { ResourcesList, ResourcesListSkeleton } from "./ResourcesList"

vi.mock("../resources.queries", () => ({ loadResourcesPage: vi.fn() }))

const paragraph = (text: string) => ({
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

const resource = (overrides: Partial<Resource> = {}): Resource =>
  ({
    course: { code: "SE 101", id: 4 },
    createdAt: "2026-06-03T00:00:00.000Z",
    description: paragraph("Four-criterion rubric with moderation notes."),
    id: 1,
    owner: {
      avatar: { id: 2, url: "/media/anna.png" },
      firstName: "Anna",
      id: 7,
      lastName: "Tui",
    },
    title: "Individual contribution rubric",
    updatedAt: "2026-06-03T00:00:00.000Z",
    ...overrides,
  }) as Resource

type ResourcesPage = Awaited<ReturnType<typeof loadResourcesPage>>

const mockPage = (docs: Resource[], totalDocs = docs.length, totalPages = 1) =>
  vi.mocked(loadResourcesPage).mockResolvedValue({
    docs,
    totalDocs,
    totalPages,
  } as unknown as ResourcesPage)

describe("ResourcesList", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders a card per resource, with its course, owner and plain-text summary", async () => {
    mockPage([resource()])

    render(await ResourcesList({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole("link", { name: "Individual contribution rubric" })).toHaveAttribute(
      "href",
      "/resources/1",
    )
    expect(screen.getByText("SE 101")).toBeInTheDocument()
    expect(screen.getByText("Four-criterion rubric with moderation notes.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Shared by Anna Tui/ })).toHaveAttribute(
      "href",
      "/members/7",
    )
  })

  it("passes the filters and page to the query", async () => {
    mockPage([resource()])

    render(
      await ResourcesList({
        searchParams: Promise.resolve({ course: "4", page: "2", q: "rubric", sort: "titleAsc" }),
      }),
    )

    expect(loadResourcesPage).toHaveBeenCalledWith(
      { courseId: 4, institutionId: undefined, search: "rubric", sort: "titleAsc" },
      { limit: 10, page: 2 },
    )
  })

  it("leaves out the badge and summary when there is no course or description text", async () => {
    mockPage([resource({ course: null, description: paragraph("   ") as Resource["description"] })])

    const { container } = render(await ResourcesList({ searchParams: Promise.resolve({}) }))

    expect(container.querySelector("[data-slot=badge]")).not.toBeInTheDocument()
    expect(container.querySelector("[data-slot=card-description]")).not.toBeInTheDocument()
  })

  it.each([
    [1, "This page is past the end of the results."],
    [0, "No resources match these filters."],
  ])("shows the correct empty state when totalDocs is %i", async (totalDocs, message) => {
    mockPage([], totalDocs, totalDocs)

    render(await ResourcesList({ searchParams: Promise.resolve({ page: "4" }) }))

    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it("links to the last page from past the end of the results", async () => {
    mockPage([], 25, 3)

    render(await ResourcesList({ searchParams: Promise.resolve({ page: "9", q: "rubric" }) }))

    expect(screen.getByRole("link", { name: "Go to the last page" })).toHaveAttribute(
      "href",
      "/resources?q=rubric&page=3",
    )
  })

  it("links to the unfiltered list when no resource matches the filters", async () => {
    mockPage([], 0, 0)

    render(await ResourcesList({ searchParams: Promise.resolve({ course: "4" }) }))

    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/resources",
    )
  })

  it("has no clear link when no filter is set", async () => {
    mockPage([], 0, 0)

    render(await ResourcesList({ searchParams: Promise.resolve({}) }))

    expect(screen.queryByRole("link", { name: "Clear filters" })).not.toBeInTheDocument()
  })
})

describe("ResourcesListSkeleton", () => {
  it("renders a full page of placeholder cards", () => {
    const { container } = render(<ResourcesListSkeleton />)

    expect(container.querySelectorAll('[data-slot="resource-card-skeleton"]')).toHaveLength(10)
  })
})
