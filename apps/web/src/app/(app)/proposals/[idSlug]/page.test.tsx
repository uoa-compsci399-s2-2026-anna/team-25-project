import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getProposalByIdCached } from "@/features/proposals/proposals.queries"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import Page from "./page"

vi.mock("@/features/proposals/proposals.queries", () => ({ getProposalByIdCached: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const emptyBody = {
  root: { children: [], direction: null, format: "", indent: 0, type: "root", version: 1 },
}

const proposal = (overrides: { author?: Array<{ id: number } | number> } = {}) => ({
  id: 1,
  author: overrides.author ?? [{ id: 10, firstName: "Anna", lastName: "Tui", institution: 1 }],
  body: emptyBody,
  createdAt: "2026-08-03T00:00:00.000Z",
  ethics: "approved",
  outputTarget: "ACE 2027 paper",
  proposalSlug: "peer-review",
  status: "active",
  summary: "Summary",
  tags: [],
  timeframe: { startPeriod: "sem1", startYear: 2027 },
  title: "Peer review study",
  updatedAt: "2026-08-03T00:00:00.000Z",
})

const renderPage = async () =>
  render(await Page({ params: Promise.resolve({ idSlug: "1-peer-review" }) }))

describe("proposal detail page - StatusAuthorCard gating", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows StatusAuthorCard to a member who is one of the proposal's authors", async () => {
    vi.mocked(getProposalByIdCached).mockResolvedValue(proposal() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 10 },
    } as never)

    await renderPage()
    expect(screen.getByText("Status - Author")).toBeInTheDocument()
  })

  it("shows StatusAuthorCard to an admin, even if they aren't an author", async () => {
    vi.mocked(getProposalByIdCached).mockResolvedValue(proposal() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "admin",
      user: { id: 999 },
    } as never)

    await renderPage()
    expect(screen.getByText("Status - Author")).toBeInTheDocument()
  })

  it("hides StatusAuthorCard from a signed-in member who isn't an author", async () => {
    vi.mocked(getProposalByIdCached).mockResolvedValue(proposal() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 999 },
    } as never)

    await renderPage()
    expect(screen.queryByText("Status - Author")).not.toBeInTheDocument()
  })

  it("hides StatusAuthorCard from a signed-out visitor", async () => {
    vi.mocked(getProposalByIdCached).mockResolvedValue(proposal() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null } as never)

    await renderPage()
    expect(screen.queryByText("Status - Author")).not.toBeInTheDocument()
  })

  it("still gates correctly when the author is an unpopulated id rather than an object", async () => {
    vi.mocked(getProposalByIdCached).mockResolvedValue(proposal({ author: [10] }) as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 10 },
    } as never)

    await renderPage()
    expect(screen.getByText("Status - Author")).toBeInTheDocument()
  })
})
