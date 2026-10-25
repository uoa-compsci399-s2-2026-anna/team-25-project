import { toast } from "@repo/ui/components/ui"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { deleteProposal } from "../../actions/deleteProposal"
import { ProposalTitleActions } from "./ProposalTitleActions"

const push = vi.fn()
const startEditing = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("@/components/Editor/EditContext", () => ({ useEdit: () => ({ startEditing }) }))
vi.mock("../../actions/deleteProposal", () => ({ deleteProposal: vi.fn() }))

const openMenu = () =>
  fireEvent.click(screen.getByRole("button", { name: "Actions for Peer assessment" }))

describe("ProposalTitleActions", () => {
  beforeEach(() => {
    vi.spyOn(toast, "add")
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    act(() => {
      toast.close()
    })
  })

  it("starts the page's inline editor when Edit is clicked", () => {
    render(<ProposalTitleActions proposalId={1} title="Peer assessment" />)
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }))

    expect(startEditing).toHaveBeenCalledOnce()
    expect(push).not.toHaveBeenCalled()
  })

  it("deletes and returns to the list when Confirm delete succeeds", async () => {
    vi.mocked(deleteProposal).mockResolvedValue({ ok: true })
    render(<ProposalTitleActions proposalId={1} title="Peer assessment" />)
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm delete" }))

    await waitFor(() => expect(deleteProposal).toHaveBeenCalledWith(1))
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "Proposal deleted" }))
    expect(push).toHaveBeenCalledWith("/proposals")
  })

  it("shows the failure message and stays put when delete fails", async () => {
    vi.mocked(deleteProposal).mockResolvedValue({
      formError: "Only the authors or an admin can delete this proposal.",
      ok: false,
    })
    render(<ProposalTitleActions proposalId={1} title="Peer assessment" />)
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm delete" }))

    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Only the authors or an admin can delete this proposal.",
          title: "Delete failed",
        }),
      ),
    )
    expect(push).not.toHaveBeenCalled()
  })
})
