import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { isOwnProfile } from "../../members.ownership"
import { getMemberProposalsCached } from "../../members.queries"
import { MemberProposals, MemberProposalsSkeleton } from "./MemberDetailProposals"

vi.mock("../../members.queries", () => ({ getMemberProposalsCached: vi.fn() }))
vi.mock("../../members.ownership", () => ({ isOwnProfile: vi.fn() }))

const proposal = {
  id: 3,
  title: "Peer assessment in capstones",
  proposalSlug: "peer-assessment-in-capstones",
  summary: "A study of peer marking.",
  status: "active",
  createdAt: "2026-08-05T00:00:00.000Z",
}

const renderProposals = async () =>
  render(await MemberProposals({ params: Promise.resolve({ memberId: "7" }) }))

describe("MemberProposals", () => {
  beforeEach(() => {
    vi.mocked(isOwnProfile).mockResolvedValue(false)
  })

  afterEach(() => {
    cleanup()
  })

  it("gives each proposal an Edit link that opens its editor on the member's own profile", async () => {
    vi.mocked(getMemberProposalsCached).mockResolvedValue([proposal] as never)
    vi.mocked(isOwnProfile).mockResolvedValue(true)

    await renderProposals()
    expect(
      screen.getByRole("button", { name: "Edit Peer assessment in capstones" }),
    ).toHaveAttribute("href", "/proposals/3-peer-assessment-in-capstones#edit")
  })

  it("has no Edit links on someone else's profile", async () => {
    vi.mocked(getMemberProposalsCached).mockResolvedValue([proposal] as never)

    await renderProposals()
    expect(screen.queryByRole("button", { name: /^Edit/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /^Edit/ })).not.toBeInTheDocument()
  })

  it("shows an empty state for each tab when the member has no proposals", async () => {
    vi.mocked(getMemberProposalsCached).mockResolvedValue([])
    const user = userEvent.setup()

    await renderProposals()
    expect(screen.getByText("No active proposals.")).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Closed - 0" }))
    expect(screen.getByText("No closed proposals.")).toBeInTheDocument()
  })

  it("links each proposal to its page", async () => {
    vi.mocked(getMemberProposalsCached).mockResolvedValue([
      {
        id: 3,
        title: "Peer assessment in capstones",
        proposalSlug: "peer-assessment-in-capstones",
        summary: "A study of peer marking.",
        status: "active",
        createdAt: "2026-08-05T00:00:00.000Z",
      },
    ] as never)

    await renderProposals()
    expect(screen.getByRole("link", { name: /Peer assessment in capstones/ })).toHaveAttribute(
      "href",
      "/proposals/3-peer-assessment-in-capstones",
    )
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.getByText("Posted 5 Aug 2026")).toBeInTheDocument()
  })

  it("leaves out the posted date when there isn't one", async () => {
    vi.mocked(getMemberProposalsCached).mockResolvedValue([
      { id: 3, title: "Untitled", proposalSlug: null, status: "active", createdAt: "" },
    ] as never)

    await renderProposals()
    expect(screen.queryByText(/Posted/)).not.toBeInTheDocument()
  })

  it("marks a closed proposal as closed", async () => {
    vi.mocked(getMemberProposalsCached).mockResolvedValue([
      { id: 3, title: "Untitled", proposalSlug: null, status: "closed", createdAt: "" },
    ] as never)
    const user = userEvent.setup()

    await renderProposals()
    await user.click(screen.getByRole("tab", { name: "Closed - 1" }))
    expect(screen.getByText("Closed")).toBeInTheDocument()
    expect(screen.getByRole("link")).toHaveAttribute("href", "/proposals/3")
  })

  it("filters proposals by the selected status tab", async () => {
    vi.mocked(getMemberProposalsCached).mockResolvedValue([
      { id: 1, title: "Active one", proposalSlug: null, status: "active", createdAt: "" },
      { id: 2, title: "Closed one", proposalSlug: null, status: "closed", createdAt: "" },
    ] as never)
    const user = userEvent.setup()

    await renderProposals()
    expect(screen.getByRole("tab", { name: "Active - 1" })).toBeInTheDocument()
    expect(screen.getByText("Active one")).toBeInTheDocument()
    expect(screen.queryByText("Closed one")).not.toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Closed - 1" }))
    expect(screen.getByText("Closed one")).toBeInTheDocument()
    expect(screen.queryByText("Active one")).not.toBeInTheDocument()
  })
})

describe("MemberProposalsSkeleton", () => {
  it("renders a heading and card placeholders", () => {
    const { container } = render(<MemberProposalsSkeleton />)
    expect(container.firstElementChild?.children).toHaveLength(3)
    cleanup()
  })
})
