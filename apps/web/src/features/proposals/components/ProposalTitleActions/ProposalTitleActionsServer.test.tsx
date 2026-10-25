import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getProposalByIdCached } from "@/features/proposals/proposals.queries"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { ProposalTitleActionsServer } from "./ProposalTitleActionsServer"

vi.mock("@/features/proposals/proposals.queries", () => ({ getProposalByIdCached: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock("@/components/Editor/EditContext", () => ({ useEdit: () => ({ startEditing: vi.fn() }) }))

const proposal = (overrides: { author?: Array<{ id: number } | number> } = {}) => ({
  id: 1,
  author: overrides.author ?? [{ id: 10, firstName: "Anna", lastName: "Tui", institution: 1 }],
  title: "Peer assessment",
})

describe("ProposalTitleActionsServer", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the dropdown to a member who is one of the proposal's authors", async () => {
    vi.mocked(getProposalByIdCached).mockResolvedValue(proposal() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 10 },
    } as never)

    render(await ProposalTitleActionsServer({ id: 1 }))

    expect(screen.getByRole("button", { name: "Actions for Peer assessment" })).toBeInTheDocument()
  })

  it("shows the dropdown to an admin, even if they aren't an author", async () => {
    vi.mocked(getProposalByIdCached).mockResolvedValue(proposal() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 999 } } as never)

    render(await ProposalTitleActionsServer({ id: 1 }))

    expect(screen.getByRole("button", { name: "Actions for Peer assessment" })).toBeInTheDocument()
  })

  it("hides the dropdown from a signed-in member who isn't an author", async () => {
    vi.mocked(getProposalByIdCached).mockResolvedValue(proposal() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 999 },
    } as never)

    const { container } = render(await ProposalTitleActionsServer({ id: 1 }))

    expect(container).toBeEmptyDOMElement()
  })

  it("hides the dropdown from a signed-out visitor", async () => {
    vi.mocked(getProposalByIdCached).mockResolvedValue(proposal() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null } as never)

    const { container } = render(await ProposalTitleActionsServer({ id: 1 }))

    expect(container).toBeEmptyDOMElement()
  })

  it("still gates correctly when the author is an unpopulated id rather than an object", async () => {
    vi.mocked(getProposalByIdCached).mockResolvedValue(proposal({ author: [10] }) as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 10 },
    } as never)

    render(await ProposalTitleActionsServer({ id: 1 }))

    expect(screen.getByRole("button", { name: "Actions for Peer assessment" })).toBeInTheDocument()
  })

  it("renders nothing when the proposal can't be found", async () => {
    vi.mocked(getProposalByIdCached).mockResolvedValue(null as never)

    const { container } = render(await ProposalTitleActionsServer({ id: 1 }))

    expect(container).toBeEmptyDOMElement()
  })
})
