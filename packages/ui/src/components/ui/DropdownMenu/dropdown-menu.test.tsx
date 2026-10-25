import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

function renderMenu(props?: { onEditClick?: () => void; onDeleteClick?: () => void }) {
  return render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={props?.onEditClick}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={props?.onDeleteClick} variant="destructive">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  )
}

describe("DropdownMenu", () => {
  afterEach(() => {
    cleanup()
  })

  it("is closed until the trigger is clicked", () => {
    renderMenu()
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    expect(screen.getByRole("menu")).toBeInTheDocument()
  })

  it("lists both items once open", () => {
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument()
  })

  it("calls an item's onClick and closes the menu", async () => {
    const onEditClick = vi.fn()
    renderMenu({ onEditClick })
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }))

    expect(onEditClick).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    })
  })

  it("marks the destructive item with data-variant", () => {
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveAttribute(
      "data-variant",
      "destructive",
    )
  })

  it("closes when the escape key is pressed", async () => {
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    })
  })

  it("exposes data-slot attributes on the trigger and content", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    expect(screen.getByText("Open menu")).toHaveAttribute("data-slot", "dropdown-menu-trigger")
    expect(document.querySelector("[data-slot=dropdown-menu-content]")).toBeInTheDocument()
  })

  it("merges a custom className onto the content and item slots", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuContent className="content-cn">
          <DropdownMenuItem className="item-cn">Edit</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    expect(document.querySelector("[data-slot=dropdown-menu-content]")).toHaveClass("content-cn")
    expect(document.querySelector("[data-slot=dropdown-menu-item]")).toHaveClass("item-cn")
  })

  it("aligns to the start of the trigger by default", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    expect(
      document.querySelector("[data-slot=dropdown-menu-content]")?.closest("[data-align]"),
    ).toHaveAttribute("data-align", "start")
  })
})
