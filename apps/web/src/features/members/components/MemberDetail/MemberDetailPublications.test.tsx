import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getMemberPublicationsCached } from "../../members.queries"
import { MemberPublications, MemberPublicationsSkeleton } from "./MemberDetailPublications"

vi.mock("../../members.queries", () => ({ getMemberPublicationsCached: vi.fn() }))
// Async, and has its own test suite - a plain render can't await a component nested
// this deep, only the one passed straight to it.
vi.mock("@/features/publications/components/PublicationCardActionsServer", () => ({
  PublicationCardActionsServer: () => null,
}))

const renderPublications = async () =>
  render(await MemberPublications({ params: Promise.resolve({ memberId: "7" }) }))

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe("MemberPublications", () => {
  it("reads the publications of the member in the route", async () => {
    vi.mocked(getMemberPublicationsCached).mockResolvedValue([])

    await renderPublications()
    expect(getMemberPublicationsCached).toHaveBeenCalledWith(7)
  })

  it("shows an empty state when the member has no publications", async () => {
    vi.mocked(getMemberPublicationsCached).mockResolvedValue([])

    await renderPublications()
    expect(screen.getByRole("heading", { level: 2, name: "Publications" })).toBeInTheDocument()
    expect(screen.getByText("No publications yet")).toBeInTheDocument()
  })

  it("shows a publication card for each publication", async () => {
    vi.mocked(getMemberPublicationsCached).mockResolvedValue([
      {
        id: 3,
        type: "article",
        title: "Peer assessment in capstones",
        year: 2025,
        authors: [
          { id: "a", name: "A. Smith", member: 7 },
          { id: "b", name: "B. Jones" },
        ],
      },
      { id: 4, type: "book", title: "Teaching software design", year: 2023, authors: [] },
    ] as never)

    await renderPublications()
    expect(screen.getByText("Journal article")).toBeInTheDocument()
    expect(screen.getByText("Book")).toBeInTheDocument()
    expect(screen.getByText("Peer assessment in capstones")).toBeInTheDocument()
    expect(screen.getByText("Published 2025")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "A. Smith" })).toHaveAttribute("href", "/members/7")
    expect(screen.getByText(/B\. Jones/)).toBeInTheDocument()
    expect(screen.queryByText("No publications yet")).not.toBeInTheDocument()
  })
})

describe("MemberPublicationsSkeleton", () => {
  it("renders the heading and two card placeholders", () => {
    const { container } = render(<MemberPublicationsSkeleton />)
    expect(screen.getByRole("heading", { level: 2, name: "Publications" })).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="publication-card-skeleton"]')).toHaveLength(2)
  })
})
