import { toast } from "@repo/ui/components/ui"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { EditProvider } from "@/components/Editor/EditContext"
import { deleteProposal } from "../../actions/deleteProposal"
import { ProposalTitleActions } from "./ProposalTitleActions"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("../../actions/deleteProposal", () => ({ deleteProposal: vi.fn() }))

// The kebab's Edit needs a real editor around it, as on the proposal page - it
// swaps to Cancel/Done once editing starts, so a mocked useEdit can't drive that.
const inEditor = (
  ui: ReactNode,
  onSave: () => Promise<{ ok: boolean }> = async () => ({ ok: true }),
) => (
  <EditProvider onSave={onSave} schema={z.object({})}>
    {ui}
  </EditProvider>
)

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
    render(inEditor(<ProposalTitleActions proposalId={1} title="Peer assessment" />))
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }))

    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })

  it("shows Cancel/Done instead of the dropdown while editing", () => {
    render(inEditor(<ProposalTitleActions proposalId={1} title="Peer assessment" />))
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }))

    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Actions for Peer assessment" }),
    ).not.toBeInTheDocument()
  })

  it("returns to the dropdown when Cancel is clicked", () => {
    render(inEditor(<ProposalTitleActions proposalId={1} title="Peer assessment" />))
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.getByRole("button", { name: "Actions for Peer assessment" })).toBeInTheDocument()
  })

  it("deletes and returns to the list when Confirm delete succeeds", async () => {
    vi.mocked(deleteProposal).mockResolvedValue({ ok: true })
    render(inEditor(<ProposalTitleActions proposalId={1} title="Peer assessment" />))
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
    render(inEditor(<ProposalTitleActions proposalId={1} title="Peer assessment" />))
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

  it("shows the failure message when deleteProposal throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(deleteProposal).mockRejectedValue(new Error("network down"))
    render(inEditor(<ProposalTitleActions proposalId={1} title="Peer assessment" />))
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm delete" }))

    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Could not delete this proposal. Try again.",
          title: "Delete failed",
        }),
      ),
    )
    expect(push).not.toHaveBeenCalled()
  })
})
