import { toast } from "@repo/ui/components/ui"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { deleteProposal } from "../actions/deleteProposal"
import { ProposalCardActions } from "./ProposalCardActions"

const push = vi.fn()
const refresh = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }))
vi.mock("../actions/deleteProposal", () => ({ deleteProposal: vi.fn() }))

const openMenu = () =>
  fireEvent.click(screen.getByRole("button", { name: "Actions for Peer assessment" }))

describe("ProposalCardActions", () => {
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

  it("navigates to the edit href when Edit is clicked", () => {
    render(
      <ProposalCardActions
        editHref="/proposals/1-peer-assessment#edit"
        proposalId={1}
        title="Peer assessment"
      />,
    )
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }))

    expect(push).toHaveBeenCalledWith("/proposals/1-peer-assessment#edit")
  })

  it("deletes and refreshes the list when Confirm delete succeeds", async () => {
    vi.mocked(deleteProposal).mockResolvedValue({ ok: true })
    render(
      <ProposalCardActions
        editHref="/proposals/1-peer-assessment#edit"
        proposalId={1}
        title="Peer assessment"
      />,
    )
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm delete" }))

    await waitFor(() => expect(deleteProposal).toHaveBeenCalledWith(1))
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "Proposal deleted" }))
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("shows the failure message and doesn't refresh when delete fails", async () => {
    vi.mocked(deleteProposal).mockResolvedValue({
      formError: "Only the authors or an admin can delete this proposal.",
      ok: false,
    })
    render(
      <ProposalCardActions
        editHref="/proposals/1-peer-assessment#edit"
        proposalId={1}
        title="Peer assessment"
      />,
    )
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
    expect(refresh).not.toHaveBeenCalled()
  })
})
