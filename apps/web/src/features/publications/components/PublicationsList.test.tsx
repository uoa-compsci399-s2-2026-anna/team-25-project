import { PublicationType } from "@repo/shared/enums/publications"
import type { Publication } from "@repo/shared/payload-types"
import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { loadPublicationsPage } from "../publications.queries"
import { PublicationsList, PublicationsListSkeleton } from "./PublicationsList"

vi.mock("../publications.queries", () => ({ loadPublicationsPage: vi.fn() }))

const publication = (overrides: Partial<Publication> = {}): Publication =>
  ({
    authors: [{ id: "a1", name: "Anna Tui" }],
    createdAt: "2026-08-03T00:00:00.000Z",
    id: 1,
    title: "Capstone assessment at scale",
    type: PublicationType.ARTICLE,
    updatedAt: "2026-08-03T00:00:00.000Z",
    year: 2024,
    ...overrides,
  }) as Publication

type PublicationsPage = Awaited<ReturnType<typeof loadPublicationsPage>>

describe("PublicationsList", () => {
  afterEach(() => {
    cleanup()
  })

  it.each([
    [1, "This page is past the end of the results."],
    [0, "No publications match these filters."],
  ])("shows the correct empty state when totalDocs is %i", async (totalDocs, message) => {
    vi.mocked(loadPublicationsPage).mockResolvedValue({
      docs: [],
      totalDocs,
      totalPages: totalDocs,
    } as unknown as PublicationsPage)

    render(await PublicationsList({ searchParams: Promise.resolve({ page: "4", q: "peer" }) }))

    expect(loadPublicationsPage).toHaveBeenCalledWith(expect.objectContaining({ search: "peer" }), {
      limit: 10,
      page: 4,
    })
    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it("links to the last page from past the end of the results", async () => {
    vi.mocked(loadPublicationsPage).mockResolvedValue({
      docs: [],
      totalDocs: 25,
      totalPages: 3,
    } as unknown as PublicationsPage)

    render(await PublicationsList({ searchParams: Promise.resolve({ page: "9", q: "peer" }) }))

    expect(screen.getByRole("link", { name: "Go to the last page" })).toHaveAttribute(
      "href",
      "/publications?q=peer&page=3",
    )
  })

  it("links each page with the current filters", async () => {
    vi.mocked(loadPublicationsPage).mockResolvedValue({
      docs: [publication()],
      totalDocs: 25,
      totalPages: 3,
    } as unknown as PublicationsPage)

    render(
      await PublicationsList({
        searchParams: Promise.resolve({ page: "2", type: "article", year: "2024" }),
      }),
    )

    const nav = screen.getByRole("navigation", { name: "pagination" })
    expect(within(nav).getByRole("link", { name: "1" })).toHaveAttribute(
      "href",
      "/publications?type=article&year=2024",
    )
    expect(within(nav).getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page")
    expect(within(nav).getByRole("link", { name: "3" })).toHaveAttribute(
      "href",
      "/publications?type=article&year=2024&page=3",
    )
  })

  it("hides the pagination for a single page", async () => {
    vi.mocked(loadPublicationsPage).mockResolvedValue({
      docs: [publication()],
      totalDocs: 1,
      totalPages: 1,
    } as unknown as PublicationsPage)

    render(await PublicationsList({ searchParams: Promise.resolve({}) }))

    expect(screen.queryByRole("navigation", { name: "pagination" })).not.toBeInTheDocument()
  })

  it("renders each publication and links member authors to their profile", async () => {
    vi.mocked(loadPublicationsPage).mockResolvedValue({
      docs: [
        publication({
          authors: [
            { id: "a1", member: 7, name: "Anna Tui" },
            { id: "a2", name: "Hemi Rangi" },
          ],
        }),
        publication({ id: 2, title: "Teams in industry projects" }),
      ],
      totalDocs: 2,
      totalPages: 1,
    } as unknown as PublicationsPage)

    render(await PublicationsList({ searchParams: Promise.resolve({}) }))

    expect(screen.getByText("Capstone assessment at scale")).toBeInTheDocument()
    expect(screen.getByText("Teams in industry projects")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Anna Tui" })).toHaveAttribute("href", "/members/7")
    expect(screen.queryByRole("link", { name: "Hemi Rangi" })).not.toBeInTheDocument()
  })
})

describe("PublicationsListSkeleton", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders a full page of placeholder cards", () => {
    const { container } = render(<PublicationsListSkeleton />)
    expect(container.querySelectorAll('[data-slot="publication-card-skeleton"]')).toHaveLength(10)
  })
})
