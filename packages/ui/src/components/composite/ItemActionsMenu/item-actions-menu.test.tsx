import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
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

  it("shows an inline confirm instead of calling onDelete straight away", () => {
    const onDelete = vi.fn()
    renderMenu({ onDelete })
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByText("Delete this? This can't be undone.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Keep" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Confirm delete" })).toBeInTheDocument()
  })

  it("shows a custom confirm message when given one", () => {
    render(
      <ItemActionsMenu
        deleteConfirmMessage="Delete this draft offering? This can't be undone."
        itemLabel="Semester 2 2026"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Actions for Semester 2 2026" }))
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))

    expect(
      screen.getByText("Delete this draft offering? This can't be undone."),
    ).toBeInTheDocument()
  })

  it("returns to the menu without deleting when Keep is clicked", () => {
    const onDelete = vi.fn()
    renderMenu({ onDelete })
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(screen.getByRole("button", { name: "Keep" }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument()
  })

  it("calls onDelete and closes when Confirm delete is clicked", async () => {
    const onDelete = vi.fn()
    renderMenu({ onDelete })
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }))

    expect(onDelete).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    })
  })

  // No assertion here: jsdom has no real CSS transitions, so Base UI's popup
  // unmounts the instant `open` goes false either way - there's no way to
  // observe the close-animation frame this fix is actually about from a jsdom
  // test. Covered by hand in Storybook/a real browser instead.

  it("drops a pending confirm when closed by escape, rather than reopening on it", async () => {
    renderMenu()
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    })

    openMenu()
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument()
  })
})
