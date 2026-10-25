import { ProposalStatus, ProposalTag } from "@repo/shared/enums/proposals"
import type { Proposal } from "@repo/shared/payload-types"
import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { loadProposalsPage } from "../proposals.queries"
import { ProposalsList, ProposalsListSkeleton } from "./ProposalsList"

vi.mock("../proposals.queries", () => ({ loadProposalsPage: vi.fn() }))
// Signed out by default, so no actions dropdown; individual tests override this.
vi.mock("@/lib/payload/getCurrentUser", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ collection: null, user: null }),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))

const proposal = (overrides: Partial<Proposal> = {}): Proposal =>
  ({
    author: [],
    body: {},
    createdAt: "2026-08-03T00:00:00.000Z",
    ethics: "unknown",
    id: 1,
    proposalSlug: "peer-assessment",
    status: ProposalStatus.ACTIVE,
    summary: "A summary",
    tags: [ProposalTag.ASSESSMENT],
    timeframe: { startPeriod: "sem1", startYear: 2027 },
    title: "Peer assessment",
    updatedAt: "2026-08-03T00:00:00.000Z",
    ...overrides,
  }) as Proposal

type ProposalsPage = Awaited<ReturnType<typeof loadProposalsPage>>

describe("ProposalsList", () => {
  afterEach(() => {
    cleanup()
  })

  it.each([
    [1, "This page is past the end of the results."],
    [0, "No proposals match these filters."],
  ])("shows the correct empty state when totalDocs is %i", async (totalDocs, message) => {
    vi.mocked(loadProposalsPage).mockResolvedValue({
      docs: [],
      totalDocs,
      totalPages: totalDocs,
    } as unknown as ProposalsPage)

    render(await ProposalsList({ searchParams: Promise.resolve({ page: "4", q: "peer" }) }))

    expect(loadProposalsPage).toHaveBeenCalledWith(expect.objectContaining({ search: "peer" }), {
      limit: 10,
      page: 4,
    })
    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it("links to the unfiltered list when the filters match nothing", async () => {
    vi.mocked(loadProposalsPage).mockResolvedValue({
      docs: [],
      totalDocs: 0,
      totalPages: 0,
    } as unknown as ProposalsPage)

    render(await ProposalsList({ searchParams: Promise.resolve({ q: "peer" }) }))

    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/proposals",
    )
  })

  it("has no clear link when no filter is set", async () => {
    vi.mocked(loadProposalsPage).mockResolvedValue({
      docs: [],
      totalDocs: 0,
      totalPages: 0,
    } as unknown as ProposalsPage)

    render(await ProposalsList({ searchParams: Promise.resolve({}) }))

    expect(screen.queryByRole("link", { name: "Clear filters" })).not.toBeInTheDocument()
  })

  it("links to the last page from past the end of the results", async () => {
    vi.mocked(loadProposalsPage).mockResolvedValue({
      docs: [],
      totalDocs: 25,
      totalPages: 3,
    } as unknown as ProposalsPage)

    render(await ProposalsList({ searchParams: Promise.resolve({ page: "9", q: "peer" }) }))

    expect(screen.getByRole("link", { name: "Go to the last page" })).toHaveAttribute(
      "href",
      "/proposals?q=peer&page=3",
    )
  })

  it("links each page with the current filters", async () => {
    vi.mocked(loadProposalsPage).mockResolvedValue({
      docs: [proposal()],
      totalDocs: 25,
      totalPages: 3,
    } as unknown as ProposalsPage)

    render(
      await ProposalsList({
        searchParams: Promise.resolve({ page: "2", status: "closed", tag: "assessment" }),
      }),
    )

    const nav = screen.getByRole("navigation", { name: "pagination" })
    expect(within(nav).getByRole("link", { name: "1" })).toHaveAttribute(
      "href",
      "/proposals?status=closed&tag=assessment",
    )
    expect(within(nav).getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page")
    expect(within(nav).getByRole("link", { name: "3" })).toHaveAttribute(
      "href",
      "/proposals?status=closed&tag=assessment&page=3",
    )
  })

  it("hides the pagination for a single page", async () => {
    vi.mocked(loadProposalsPage).mockResolvedValue({
      docs: [proposal()],
      totalDocs: 1,
      totalPages: 1,
    } as unknown as ProposalsPage)

    render(await ProposalsList({ searchParams: Promise.resolve({}) }))

    expect(screen.queryByRole("navigation", { name: "pagination" })).not.toBeInTheDocument()
  })

  it("renders populated and missing author details", async () => {
    vi.mocked(loadProposalsPage).mockResolvedValue({
      docs: [
        proposal({
          author: [
            {
              avatar: { url: "/anna.png" },
              firstName: "Anna",
              institution: { name: "University of Auckland" },
              lastName: "Tui",
            },
          ] as unknown as Proposal["author"],
        }),
        proposal({
          author: [99],
          id: 2,
          proposalSlug: null,
          tags: undefined,
          title: "Unknown author proposal",
        }),
        proposal({
          author: [
            { avatar: 5, firstName: "Hemi", institution: 12, lastName: "Rangi" },
          ] as unknown as Proposal["author"],
          id: 3,
          title: "Numeric relations",
        }),
      ],
      totalDocs: 3,
      totalPages: 1,
    } as unknown as ProposalsPage)

    render(await ProposalsList({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole("link", { name: "Peer assessment" })).toHaveAttribute(
      "href",
      "/proposals/1-peer-assessment",
    )
    expect(screen.getByText("Anna Tui")).toBeInTheDocument()
    expect(screen.getByText("University of Auckland")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Unknown author proposal" })).toHaveAttribute(
      "href",
      "/proposals/2",
    )
    expect(screen.getByText("Unknown author")).toBeInTheDocument()
    expect(screen.getByText("Hemi Rangi")).toBeInTheDocument()
    expect(screen.getAllByText("Assessment")).toHaveLength(2)
  })

  it("lists every populated author, each linked to their profile", async () => {
    vi.mocked(loadProposalsPage).mockResolvedValue({
      docs: [
        proposal({
          author: [
            {
              firstName: "Anna",
              id: 1,
              institution: { name: "University of Auckland" },
              lastName: "Tui",
            },
            {
              firstName: "Ben",
              id: 2,
              institution: { name: "Victoria University" },
              lastName: "Lee",
            },
            99,
          ] as unknown as Proposal["author"],
        }),
      ],
      totalDocs: 1,
      totalPages: 1,
    } as unknown as ProposalsPage)

    render(await ProposalsList({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole("link", { name: "Anna Tui" })).toHaveAttribute("href", "/members/1")
    expect(screen.getByRole("link", { name: "Ben Lee" })).toHaveAttribute("href", "/members/2")
    expect(screen.getByText("University of Auckland, Victoria University")).toBeInTheDocument()
    expect(screen.queryByText("Unknown author")).not.toBeInTheDocument()
  })

  it("shows the Edit/Delete dropdown to one of the proposal's own authors", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      // biome-ignore lint/suspicious/noExplicitAny: only the fields the component reads
      user: { id: 2 } as any,
    })
    vi.mocked(loadProposalsPage).mockResolvedValue({
      docs: [proposal({ author: [1, 2] as unknown as Proposal["author"] })],
      totalDocs: 1,
      totalPages: 1,
    } as unknown as ProposalsPage)

    render(await ProposalsList({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole("button", { name: "Actions for Peer assessment" })).toBeInTheDocument()
  })

  it("shows the dropdown to an admin regardless of authorship", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "admin",
      // biome-ignore lint/suspicious/noExplicitAny: only the fields the component reads
      user: { id: 999 } as any,
    })
    vi.mocked(loadProposalsPage).mockResolvedValue({
      docs: [proposal({ author: [1] as unknown as Proposal["author"] })],
      totalDocs: 1,
      totalPages: 1,
    } as unknown as ProposalsPage)

    render(await ProposalsList({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole("button", { name: "Actions for Peer assessment" })).toBeInTheDocument()
  })

  it("hides the dropdown from a signed-in member who isn't an author", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      // biome-ignore lint/suspicious/noExplicitAny: only the fields the component reads
      user: { id: 3 } as any,
    })
    vi.mocked(loadProposalsPage).mockResolvedValue({
      docs: [proposal({ author: [1, 2] as unknown as Proposal["author"] })],
      totalDocs: 1,
      totalPages: 1,
    } as unknown as ProposalsPage)

    render(await ProposalsList({ searchParams: Promise.resolve({}) }))

    expect(
      screen.queryByRole("button", { name: "Actions for Peer assessment" }),
    ).not.toBeInTheDocument()
  })
})

describe("ProposalsListSkeleton", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders a full page of placeholder cards", () => {
    const { container } = render(<ProposalsListSkeleton />)
    expect(container.querySelectorAll('[data-slot="proposal-card-skeleton"]')).toHaveLength(10)
  })
})
