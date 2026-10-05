import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getMemberPublicationsCached } from "../members.queries"
import { MemberPublications, MemberPublicationsSkeleton } from "./MemberDetailPublications"

vi.mock("../members.queries", () => ({ getMemberPublicationsCached: vi.fn() }))

const renderPublications = async () =>
  render(await MemberPublications({ params: Promise.resolve({ memberId: "7" }) }))

describe("MemberPublications", () => {
  afterEach(() => {
    cleanup()
  })

  it("reads the publications of the member in the route", async () => {
    vi.mocked(getMemberPublicationsCached).mockResolvedValue([])

    await renderPublications()
    expect(getMemberPublicationsCached).toHaveBeenCalledWith(7)
  })

  it("shows an empty state when the member has no publications", async () => {
    vi.mocked(getMemberPublicationsCached).mockResolvedValue([])

    await renderPublications()
    expect(screen.getByRole("heading", { level: 2, name: "Publications" })).toBeInTheDocument()
    expect(screen.getByText("No publications yet.")).toBeInTheDocument()
  })

  it("shows a card for each publication with its type, title, year and authors", async () => {
    vi.mocked(getMemberPublicationsCached).mockResolvedValue([
      {
        id: 3,
        type: "article",
        title: "Peer assessment in capstones",
        year: 2025,
        authors: [{ name: "A. Smith", member: 7 }, { name: "B. Jones" }],
      },
      { id: 4, type: "book", title: "Teaching software design", year: 2023, authors: [] },
    ] as never)

    await renderPublications()
    expect(screen.getByText("Journal article")).toBeInTheDocument()
    expect(screen.getByText("Book")).toBeInTheDocument()
    expect(screen.getByText("Peer assessment in capstones")).toBeInTheDocument()
    expect(screen.getByText("Published 2025")).toBeInTheDocument()
    expect(screen.getByText("A. Smith, B. Jones")).toBeInTheDocument()
    expect(screen.queryByText("No publications yet.")).not.toBeInTheDocument()
  })
})

describe("MemberPublicationsSkeleton", () => {
  it("renders the heading and card placeholders", () => {
    const { container } = render(<MemberPublicationsSkeleton />)
    expect(screen.getByRole("heading", { level: 2, name: "Publications" })).toBeInTheDocument()
    expect(container.firstElementChild?.children).toHaveLength(3)
    cleanup()
  })
})
