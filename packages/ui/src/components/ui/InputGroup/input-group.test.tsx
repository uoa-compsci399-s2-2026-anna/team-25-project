import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group"

describe("InputGroup", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders a group wrapper with the data-slot attribute", () => {
    render(
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
      </InputGroup>,
    )
    expect(screen.getByRole("group")).toHaveAttribute("data-slot", "input-group")
  })

  it("marks the input as the group control", () => {
    render(
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
      </InputGroup>,
    )
    expect(screen.getByPlaceholderText("Search...")).toHaveAttribute(
      "data-slot",
      "input-group-control",
    )
  })

  it("marks the textarea as the group control", () => {
    render(
      <InputGroup>
        <InputGroupTextarea placeholder="Write a note..." />
      </InputGroup>,
    )
    expect(screen.getByPlaceholderText("Write a note...")).toHaveAttribute(
      "data-slot",
      "input-group-control",
    )
  })

  it("focuses the input when the addon is clicked", async () => {
    const user = userEvent.setup()
    render(
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon>
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    )
    await user.click(screen.getByText("@"))
    expect(screen.getByPlaceholderText("Search...")).toHaveFocus()
  })

  it("does not steal focus when a button inside the addon is clicked", async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon align="inline-end">
          <InputGroupButton onClick={onClick}>Go</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    )
    await user.click(screen.getByRole("button", { name: "Go" }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByPlaceholderText("Search...")).not.toHaveFocus()
  })

  it("runs a consumer onClick and still focuses the input", async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon onClick={onClick}>
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    )
    await user.click(screen.getByText("@"))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByPlaceholderText("Search...")).toHaveFocus()
  })

  it("lets a consumer opt out of click-to-focus with preventDefault", async () => {
    const user = userEvent.setup()
    render(
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon
          onClick={(e) => {
            e.preventDefault()
          }}
        >
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    )
    await user.click(screen.getByText("@"))
    expect(screen.getByPlaceholderText("Search...")).not.toHaveFocus()
  })

  it("defaults the addon alignment to inline-start", () => {
    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    )
    const addon = screen.getByText("@").parentElement
    expect(addon).toHaveAttribute("data-align", "inline-start")
    expect(addon).toHaveClass("order-first")
  })

  it("renders the addon with the requested alignment", () => {
    render(
      <InputGroup>
        <InputGroupAddon align="block-end">
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    )
    const addon = screen.getByText("@").parentElement
    expect(addon).toHaveAttribute("data-align", "block-end")
    expect(addon).toHaveClass("order-last")
  })

  it("renders the button as a non-submitting button by default", () => {
    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupButton>Go</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    )
    const button = screen.getByRole("button", { name: "Go" })
    expect(button).toHaveAttribute("type", "button")
    expect(button).toHaveAttribute("data-size", "xs")
  })

  it("defaults to the field variant", () => {
    render(
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
      </InputGroup>,
    )
    const group = screen.getByRole("group")
    expect(group).toHaveAttribute("data-variant", "field")
    expect(group).toHaveClass("rounded-lg", "border-brand-border", "bg-brand-cream/60")
  })

  it("renders the pill variant with a full radius and no fill", () => {
    render(
      <InputGroup variant="pill">
        <InputGroupInput placeholder="Search..." />
      </InputGroup>,
    )
    const group = screen.getByRole("group")
    expect(group).toHaveAttribute("data-variant", "pill")
    expect(group).toHaveClass("rounded-full", "border-foreground/15", "bg-transparent")
  })

  it("merges a custom className with the base classes", () => {
    render(
      <InputGroup className="custom-class">
        <InputGroupInput placeholder="Search..." />
      </InputGroup>,
    )
    expect(screen.getByRole("group")).toHaveClass("custom-class", "rounded-lg")
  })
})
