import type { Publication } from "@repo/shared/payload-types"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { getAuthorCandidatesCached } from "../authorCandidates.queries"
import { PublicationCardActionsServer } from "./PublicationCardActionsServer"

vi.mock("../authorCandidates.queries", () => ({ getAuthorCandidatesCached: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock("../actions/updatePublication", () => ({ updatePublication: vi.fn() }))
vi.mock("../actions/deletePublication", () => ({ deletePublication: vi.fn() }))

const candidate = {
  avatarUrl: undefined,
  firstName: "Anna",
  id: 10,
  institution: "University of Auckland",
  lastName: "Tui",
  position: "Lecturer",
}

const publication = (overrides: { authors?: Publication["authors"] } = {}) =>
  ({
    abstract: null,
    authors: overrides.authors ?? [{ id: "a1", member: 10, name: "Anna Tui" }],
    citationKey: null,
    doi: "10.1145/1",
    id: 1,
    issue: null,
    month: null,
    pages: null,
    publisher: null,
    tags: null,
    title: "Peer assessment in capstones",
    type: "article",
    url: null,
    venue: null,
    volume: null,
    year: 2025,
  }) as unknown as Publication

describe("PublicationCardActionsServer", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the dropdown to a linked author", async () => {
    vi.mocked(getAuthorCandidatesCached).mockResolvedValue([candidate])
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 10 },
    } as never)

    render(await PublicationCardActionsServer({ publication: publication() }))

    expect(
      screen.getByRole("button", { name: "Actions for Peer assessment in capstones" }),
    ).toBeInTheDocument()
  })

  // Admins manage publications from the admin dashboard - and their ids are their own,
  // so one matching an author's is no claim to the publication.
  it("hides the dropdown from an admin, even one sharing a linked author's id", async () => {
    vi.mocked(getAuthorCandidatesCached).mockResolvedValue([candidate])
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 10 } } as never)

    const { container } = render(await PublicationCardActionsServer({ publication: publication() }))

    expect(container).toBeEmptyDOMElement()
  })

  it("hides the dropdown from a signed-in member who isn't a linked author", async () => {
    vi.mocked(getAuthorCandidatesCached).mockResolvedValue([candidate])
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 999 },
    } as never)

    const { container } = render(await PublicationCardActionsServer({ publication: publication() }))

    expect(container).toBeEmptyDOMElement()
  })

  it("hides the dropdown from a signed-out visitor", async () => {
    vi.mocked(getAuthorCandidatesCached).mockResolvedValue([candidate])
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null } as never)

    const { container } = render(await PublicationCardActionsServer({ publication: publication() }))

    expect(container).toBeEmptyDOMElement()
  })

  it("still gates correctly when the author is an unpopulated id rather than an object", async () => {
    vi.mocked(getAuthorCandidatesCached).mockResolvedValue([candidate])
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 10 },
    } as never)

    render(
      await PublicationCardActionsServer({
        publication: publication({ authors: [{ id: "a1", member: 10, name: "Anna Tui" }] }),
      }),
    )

    expect(
      screen.getByRole("button", { name: "Actions for Peer assessment in capstones" }),
    ).toBeInTheDocument()
  })

  it("resolves a linked author to their full candidate, for the edit form's rows", async () => {
    vi.mocked(getAuthorCandidatesCached).mockResolvedValue([candidate])
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 10 },
    } as never)

    render(
      await PublicationCardActionsServer({
        publication: publication({
          authors: [
            { id: "a1", member: 10, name: "A. Tui" },
            { id: "a2", member: null, name: "External Co-Author" },
          ],
        }),
      }),
    )

    // Opening the dropdown and the edit dialog is covered by PublicationCardActions'
    // own tests - this just checks the server piece doesn't throw while resolving
    // a mix of linked and external authors.
    expect(
      screen.getByRole("button", { name: "Actions for Peer assessment in capstones" }),
    ).toBeInTheDocument()
  })

  // A member added since the candidates cache last refreshed must stay linked,
  // not turn into an external author that the next save quietly unlinks.
  it("keeps a linked author the candidates cache doesn't have yet, and logs it", async () => {
    const warn = vi.fn()
    vi.mocked(getPayloadClient).mockResolvedValue({ logger: { warn } } as never)
    vi.mocked(getAuthorCandidatesCached).mockResolvedValue([])
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 42 },
    } as never)

    render(
      await PublicationCardActionsServer({
        publication: publication({ authors: [{ id: "a1", member: 42, name: "A. Tui" }] }),
      }),
    )
    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Peer assessment in capstones" }),
    )
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }))

    expect(screen.getByRole("button", { name: "Unlink author 1 from A. Tui" })).toBeInTheDocument()
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ memberIds: [42], publicationId: 1 }),
      expect.any(String),
    )
  })
})
