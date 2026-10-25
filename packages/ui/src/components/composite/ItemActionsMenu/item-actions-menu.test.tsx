import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ItemActionsMenu } from "./item-actions-menu"

function renderMenu(overrides?: { onEdit?: () => void; onDelete?: () => void }) {
  return render(
    <ItemActionsMenu
      itemLabel="CS399"
      onDelete={overrides?.onDelete ?? vi.fn()}
      onEdit={overrides?.onEdit ?? vi.fn()}
    />,
  )
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Actions for CS399" }))
}

describe("ItemActionsMenu", () => {
  afterEach(() => {
    cleanup()
  })

  it("names the trigger after the item, for screen readers to tell rows apart", () => {
    renderMenu()
    expect(screen.getByRole("button", { name: "Actions for CS399" })).toBeInTheDocument()
  })

  it("shows Edit and Delete once opened", () => {
    renderMenu()
    openMenu()
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument()
  })

  it("omits Delete when onDelete isn't given - e.g. an editor who can't delete", () => {
    render(<ItemActionsMenu itemLabel="CS399" onEdit={vi.fn()} />)
    openMenu()
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument()
  })

  it("calls onEdit and closes when Edit is clicked", async () => {
    const onEdit = vi.fn()
    renderMenu({ onEdit })
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }))

    expect(onEdit).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    })
  })

  it("opens a confirm dialog instead of calling onDelete straight away", async () => {
    const onDelete = vi.fn()
    renderMenu({ onDelete })
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))

    expect(onDelete).not.toHaveBeenCalled()
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Delete CS399?")).toBeInTheDocument()
    expect(within(dialog).getByText("This can't be undone.")).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Keep" })).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Confirm delete" })).toBeInTheDocument()
  })

  it("shows a custom confirm message when given one", async () => {
    render(
      <ItemActionsMenu
        deleteConfirmMessage="Deleting this draft offering can't be undone."
        itemLabel="Semester 2 2026"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Actions for Semester 2 2026" }))
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))

    expect(
      await screen.findByText("Deleting this draft offering can't be undone."),
    ).toBeInTheDocument()
  })

  it("closes without deleting when Keep is clicked", async () => {
    const onDelete = vi.fn()
    renderMenu({ onDelete })
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Keep" }))

    expect(onDelete).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    openMenu()
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument()
  })

  it("calls onDelete and closes when Confirm delete is clicked", async () => {
    const onDelete = vi.fn()
    renderMenu({ onDelete })
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm delete" }))

    expect(onDelete).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("drops a pending confirm when the dialog is closed by escape", async () => {
    const onDelete = vi.fn()
    renderMenu({ onDelete })
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.keyDown(dialog, { key: "Escape" })

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
    expect(onDelete).not.toHaveBeenCalled()

    openMenu()
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument()
  })
})
