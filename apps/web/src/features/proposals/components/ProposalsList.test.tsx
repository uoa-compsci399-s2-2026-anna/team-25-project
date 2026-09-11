import { ProposalStatus, ProposalTag } from "@repo/shared/enums/proposals"
import type { Proposal } from "@repo/shared/payload-types"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
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

describe("ProposalsList", () => {
  it.each([
    [1, "This page is past the end of the results."],
    [0, "No proposals match these filters."],
  ])("shows the correct empty state when totalDocs is %i", async (totalDocs, message) => {
    vi.mocked(loadProposalsPage).mockResolvedValue({ docs: [], totalDocs } as unknown as Awaited<
      ReturnType<typeof loadProposalsPage>
    >)

    render(await ProposalsList({ searchParams: Promise.resolve({ page: "4", q: "peer" }) }))

    expect(loadProposalsPage).toHaveBeenCalledWith(expect.objectContaining({ search: "peer" }), {
      limit: 10,
      page: 4,
    })
    expect(screen.getByText(message)).toBeInTheDocument()
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
    } as unknown as Awaited<ReturnType<typeof loadProposalsPage>>)

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
