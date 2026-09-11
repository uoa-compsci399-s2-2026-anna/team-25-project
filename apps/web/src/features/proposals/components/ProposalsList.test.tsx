import { ProposalStatus, ProposalTag } from "@repo/shared/enums/proposals"
import type { Proposal } from "@repo/shared/payload-types"
import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { loadProposalsPage } from "../proposals.queries"
import { ProposalsList } from "./ProposalsList"

vi.mock("../proposals.queries", () => ({ loadProposalsPage: vi.fn() }))

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
    expect(screen.getByText("Anna Tui - University of Auckland")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Unknown author proposal" })).toHaveAttribute(
      "href",
      "/proposals/2",
    )
    expect(screen.getByText("Unknown author")).toBeInTheDocument()
    expect(screen.getByText("Hemi Rangi")).toBeInTheDocument()
    expect(screen.getAllByText("Assessment")).toHaveLength(2)
  })
})
