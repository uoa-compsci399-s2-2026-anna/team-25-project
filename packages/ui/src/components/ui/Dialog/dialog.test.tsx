import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"

function renderDialog(props?: {
  showCloseButton?: boolean
  showFooterCloseButton?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return render(
    <Dialog onOpenChange={props?.onOpenChange}>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent showCloseButton={props?.showCloseButton}>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton={props?.showFooterCloseButton}>
          <button type="button">Confirm</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
  )
}

describe("Dialog", () => {
  afterEach(() => {
    cleanup()
  })

  it("is closed until the trigger is clicked", () => {
    renderDialog()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("renders the title and description as the dialog's accessible name and description", () => {
    renderDialog()
    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }))
    const dialog = screen.getByRole("dialog", { name: "Delete project" })
    expect(dialog).toHaveAccessibleDescription("This action cannot be undone.")
  })

  it("renders a close button by default and closes the dialog when clicked", async () => {
    renderDialog()
    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }))
    const close = screen.getByRole("button", { name: "Close dialog" })
    fireEvent.click(close)
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("omits the close button when showCloseButton is false", () => {
    renderDialog({ showCloseButton: false })
    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Close dialog" })).not.toBeInTheDocument()
  })

  it("closes when the escape key is pressed", async () => {
    renderDialog()
    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("closes when the overlay is clicked", async () => {
    renderDialog()
    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }))
    const overlay = document.querySelector("[data-slot=dialog-overlay]")
    expect(overlay).not.toBeNull()
    fireEvent.click(overlay as Element)
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("does not render a footer close button by default", () => {
    renderDialog({ showCloseButton: false })
    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }))
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument()
  })

  it("renders a footer close button when showCloseButton is true and closes the dialog", async () => {
    renderDialog({ showCloseButton: false, showFooterCloseButton: true })
    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }))
    const close = screen.getByRole("button", { name: "Close" })
    fireEvent.click(close)
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("calls onOpenChange with the new open state", () => {
    const onOpenChange = vi.fn()
    renderDialog({ onOpenChange })
    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }))
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it("calls onOpenChange with false when the dialog is closed", async () => {
    const onOpenChange = vi.fn()
    renderDialog({ onOpenChange })
    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }))
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }))
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
    })
  })

  it("supports an explicit DialogClose element", async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Title</DialogTitle>
          <DialogClose>Dismiss</DialogClose>
        </DialogContent>
      </Dialog>,
    )
    fireEvent.click(screen.getByRole("button", { name: "Open" }))
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }))
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("merges a custom className on the content, header, and footer slots", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent className="content-cn" showCloseButton={false}>
          <DialogHeader className="header-cn">
            <DialogTitle className="title-cn">Title</DialogTitle>
            <DialogDescription className="desc-cn">Description</DialogDescription>
          </DialogHeader>
          <DialogFooter className="footer-cn" />
        </DialogContent>
      </Dialog>,
    )
    expect(document.querySelector("[data-slot=dialog-content]")).toHaveClass("content-cn")
    expect(document.querySelector("[data-slot=dialog-header]")).toHaveClass("header-cn")
    expect(document.querySelector("[data-slot=dialog-title]")).toHaveClass("title-cn")
    expect(document.querySelector("[data-slot=dialog-description]")).toHaveClass("desc-cn")
    expect(document.querySelector("[data-slot=dialog-footer]")).toHaveClass("footer-cn")
  })
})
