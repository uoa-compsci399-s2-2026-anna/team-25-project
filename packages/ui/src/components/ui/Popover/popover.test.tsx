import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Avatar, AvatarFallback } from "../Avatar/avatar"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "./popover"

const mockMember = {
  email: "maya.chen@example.ac.nz",
  initials: "MC",
  name: "Maya Chen",
}

function renderPopover(props?: {
  showCloseButton?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return render(
    <Popover onOpenChange={props?.onOpenChange}>
      <PopoverTrigger>Open popover</PopoverTrigger>
      <PopoverContent showCloseButton={props?.showCloseButton}>
        <PopoverTitle>Dimensions</PopoverTitle>
        <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
      </PopoverContent>
    </Popover>,
  )
}

describe("Popover", () => {
  afterEach(() => {
    cleanup()
  })

  it("is closed until the trigger is clicked", () => {
    renderPopover()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Open popover" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("renders the title and description as the popover's accessible name and description", () => {
    renderPopover()
    fireEvent.click(screen.getByRole("button", { name: "Open popover" }))
    expect(screen.getByRole("dialog", { name: "Dimensions" })).toHaveAccessibleDescription(
      "Set the dimensions for the layer.",
    )
  })

  it("omits the close button by default", () => {
    renderPopover()
    fireEvent.click(screen.getByRole("button", { name: "Open popover" }))
    expect(screen.queryByRole("button", { name: "Close popover" })).not.toBeInTheDocument()
  })

  it("renders a close button when showCloseButton is true and closes the popover when clicked", async () => {
    renderPopover({ showCloseButton: true })
    fireEvent.click(screen.getByRole("button", { name: "Open popover" }))
    fireEvent.click(screen.getByRole("button", { name: "Close popover" }))
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("closes when the escape key is pressed", async () => {
    renderPopover()
    fireEvent.click(screen.getByRole("button", { name: "Open popover" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("supports an explicit PopoverClose element", async () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Title</PopoverTitle>
          <PopoverClose>Dismiss</PopoverClose>
        </PopoverContent>
      </Popover>,
    )
    fireEvent.click(screen.getByRole("button", { name: "Open" }))
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }))
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("calls onOpenChange with the new open state", () => {
    const onOpenChange = vi.fn()
    renderPopover({ onOpenChange })
    fireEvent.click(screen.getByRole("button", { name: "Open popover" }))
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it("respects a controlled open prop", () => {
    render(
      <Popover open>
        <PopoverTrigger>Open popover</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Dimensions</PopoverTitle>
        </PopoverContent>
      </Popover>,
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("renders as open when defaultOpen is set", () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open popover</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Dimensions</PopoverTitle>
        </PopoverContent>
      </Popover>,
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("exposes data-slot attributes on the trigger and content", () => {
    render(
      <Popover open>
        <PopoverTrigger>Open popover</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Dimensions</PopoverTitle>
        </PopoverContent>
      </Popover>,
    )
    expect(screen.getByText("Open popover")).toHaveAttribute("data-slot", "popover-trigger")
    expect(document.querySelector("[data-slot=popover-content]")).toBeInTheDocument()
  })

  it("merges a custom className onto the content, title, and description slots", () => {
    render(
      <Popover open>
        <PopoverContent className="content-cn">
          <PopoverTitle className="title-cn">Title</PopoverTitle>
          <PopoverDescription className="desc-cn">Description</PopoverDescription>
        </PopoverContent>
      </Popover>,
    )
    expect(document.querySelector("[data-slot=popover-content]")).toHaveClass("content-cn")
    expect(document.querySelector("[data-slot=popover-title]")).toHaveClass("title-cn")
    expect(document.querySelector("[data-slot=popover-description]")).toHaveClass("desc-cn")
  })

  it("forwards the side prop to the positioner", () => {
    render(
      <Popover open>
        <PopoverContent side="right">
          <PopoverTitle>Title</PopoverTitle>
        </PopoverContent>
      </Popover>,
    )
    expect(
      document.querySelector("[data-slot=popover-content]")?.closest("[data-side]"),
    ).toHaveAttribute("data-side", "right")
  })

  it("opens an account menu from an avatar trigger", () => {
    const onLogOut = vi.fn()
    render(
      <Popover>
        <PopoverTrigger nativeButton={false} render={<Avatar />}>
          <AvatarFallback>{mockMember.initials}</AvatarFallback>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>{mockMember.name}</PopoverTitle>
          <PopoverDescription>{mockMember.email}</PopoverDescription>
          <button onClick={onLogOut} type="button">
            Log out
          </button>
        </PopoverContent>
      </Popover>,
    )

    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: mockMember.initials }))

    expect(screen.getByRole("dialog", { name: mockMember.name })).toHaveAccessibleDescription(
      mockMember.email,
    )

    fireEvent.click(screen.getByRole("button", { name: "Log out" }))
    expect(onLogOut).toHaveBeenCalledOnce()
  })

  // "end" rather than "start", which is the default - a default would pass whether or not
  // the prop actually reached the positioner.
  it("forwards the align prop to the positioner", () => {
    render(
      <Popover open>
        <PopoverContent align="end">
          <PopoverTitle>Title</PopoverTitle>
        </PopoverContent>
      </Popover>,
    )
    expect(
      document.querySelector("[data-slot=popover-content]")?.closest("[data-align]"),
    ).toHaveAttribute("data-align", "end")
  })

  it("aligns to the start of the trigger by default", () => {
    render(
      <Popover open>
        <PopoverContent>
          <PopoverTitle>Title</PopoverTitle>
        </PopoverContent>
      </Popover>,
    )
    expect(
      document.querySelector("[data-slot=popover-content]")?.closest("[data-align]"),
    ).toHaveAttribute("data-align", "start")
  })
})
