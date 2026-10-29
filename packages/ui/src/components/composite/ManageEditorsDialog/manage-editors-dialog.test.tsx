import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ManageEditorsDialog, type ManageEditorsDialogProps } from "./manage-editors-dialog"

const owner = { id: 1, firstName: "Ada", lastName: "Lovelace" }
const alan = { id: 2, firstName: "Alan", lastName: "Turing" }
const grace = { id: 3, firstName: "Grace", lastName: "Hopper" }

const renderDialog = (overrides: Partial<ManageEditorsDialogProps> = {}) =>
  render(
    <ManageEditorsDialog
      editors={[alan, grace]}
      onEditorsChange={vi.fn()}
      onSave={vi.fn()}
      onSearch={vi.fn()}
      open
      owner={owner}
      {...overrides}
    />,
  )

describe("ManageEditorsDialog", () => {
  afterEach(() => {
    cleanup()
  })

  it("offers ownership only to saved editors", () => {
    renderDialog({ onTransfer: vi.fn(), transferableIds: [2] })

    expect(screen.getByRole("button", { name: "Make Alan Turing the owner" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Make Grace Hopper the owner" }),
    ).not.toBeInTheDocument()
  })

  it("asks to confirm before transferring ownership", () => {
    const onTransfer = vi.fn()
    renderDialog({ onTransfer, transferableIds: [2, 3] })

    fireEvent.click(screen.getByRole("button", { name: "Make Alan Turing the owner" }))
    expect(onTransfer).not.toHaveBeenCalled()
    expect(
      screen.getByText(/Make Alan Turing the owner\? You stay on as an editor/),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Transfer ownership" }))
    expect(onTransfer).toHaveBeenCalledWith(alan)
  })

  it("waits for unsaved changes to the list before it offers a transfer", () => {
    renderDialog({ editors: [alan], onTransfer: vi.fn(), transferableIds: [2, 3] })

    expect(screen.getByRole("button", { name: "Make Alan Turing the owner" })).toBeDisabled()
    expect(screen.getByText("Save your changes before you transfer ownership.")).toBeInTheDocument()
  })

  it("backs out of a transfer", () => {
    const onTransfer = vi.fn()
    renderDialog({ onTransfer, transferableIds: [2, 3] })

    fireEvent.click(screen.getByRole("button", { name: "Make Alan Turing the owner" }))
    fireEvent.click(screen.getByRole("button", { name: "Keep ownership" }))

    expect(onTransfer).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Save editors" })).toBeInTheDocument()
  })

  it("lists the owner first, without a way to remove them", () => {
    renderDialog()

    const items = screen.getAllByRole("listitem")
    expect(items[0]).toHaveTextContent("Ada LovelaceOwner")
    expect(screen.queryByRole("button", { name: "Remove Ada Lovelace" })).not.toBeInTheDocument()
  })

  it("reports the list without a removed editor", () => {
    const onEditorsChange = vi.fn()
    renderDialog({ onEditorsChange })

    fireEvent.click(screen.getByRole("button", { name: "Remove Alan Turing" }))

    expect(onEditorsChange).toHaveBeenCalledWith([grace])
  })

  it("saves through onSave and shows a form error", () => {
    const onSave = vi.fn()
    renderDialog({ formError: "Only the owner or an admin can manage editors.", onSave })

    fireEvent.click(screen.getByRole("button", { name: "Save editors" }))

    expect(onSave).toHaveBeenCalledOnce()
    expect(screen.getByRole("alert")).toHaveTextContent("Only the owner or an admin")
  })

  it("disables its controls while saving", () => {
    renderDialog({ saving: "editors" })

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Remove Alan Turing" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
  })

  it("stays open while saving", () => {
    const onOpenChange = vi.fn()
    renderDialog({ onOpenChange, saving: "editors" })

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" })

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  // A transfer saves the stored editors, so the list must not change while it waits.
  it("locks the editor list while a transfer waits to be confirmed", () => {
    renderDialog({ onTransfer: vi.fn(), transferableIds: [2, 3] })

    fireEvent.click(screen.getByRole("button", { name: "Make Alan Turing the owner" }))

    expect(screen.getByRole("button", { name: "Remove Grace Hopper" })).toBeDisabled()
    expect(screen.getByRole("combobox", { name: "Add an editor" })).toBeDisabled()
  })
})
