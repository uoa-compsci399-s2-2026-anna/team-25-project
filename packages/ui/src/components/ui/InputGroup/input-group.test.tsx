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

  it("focuses the textarea when the addon is clicked", async () => {
    const user = userEvent.setup()
    render(
      <InputGroup>
        <InputGroupTextarea placeholder="Write a note..." />
        <InputGroupAddon align="block-end">
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    )
    await user.click(screen.getByText("@"))
    expect(screen.getByPlaceholderText("Write a note...")).toHaveFocus()
  })

  it("focuses the control when the addon is not a direct child of the group", async () => {
    const user = userEvent.setup()
    render(
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
        <div>
          <InputGroupAddon>
            <InputGroupText>@</InputGroupText>
          </InputGroupAddon>
        </div>
      </InputGroup>,
    )
    await user.click(screen.getByText("@"))
    expect(screen.getByPlaceholderText("Search...")).toHaveFocus()
  })

  it("focuses the control when the group has an interactive ancestor", async () => {
    const user = userEvent.setup()
    render(
      // biome-ignore lint/a11y/useSemanticElements: reproduces a composite card whose role previously escaped the addon's closest() boundary
      <div role="button" tabIndex={0}>
        <InputGroup>
          <InputGroupInput placeholder="Search..." />
          <InputGroupAddon>
            <InputGroupText>@</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </div>,
    )
    await user.click(screen.getByText("@"))
    expect(screen.getByPlaceholderText("Search...")).toHaveFocus()
  })

  it("focuses the group control, not an input living inside the addon", async () => {
    const user = userEvent.setup()
    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>@</InputGroupText>
          <input aria-label="Unit" />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search..." />
      </InputGroup>,
    )
    await user.click(screen.getByText("@"))
    expect(screen.getByPlaceholderText("Search...")).toHaveFocus()
  })

  it("does not steal focus when a link inside the addon is clicked", async () => {
    const user = userEvent.setup()
    render(
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon>
          <a href="#help">Help</a>
        </InputGroupAddon>
      </InputGroup>,
    )
    await user.click(screen.getByRole("link", { name: "Help" }))
    expect(screen.getByPlaceholderText("Search...")).not.toHaveFocus()
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
    const addon = screen.getByText("@").closest("[data-slot=input-group-addon]")
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
    const addon = screen.getByText("@").closest("[data-slot=input-group-addon]")
    expect(addon).toHaveAttribute("data-align", "block-end")
    expect(addon).toHaveClass("order-last")
  })

  it("keeps the invalid control matchable by the shell's error selector", () => {
    // Shell keys off `has-[[data-slot][aria-invalid=true]]`. That class is unconditional,
    // so asserting it proves nothing; dropping either attribute kills the styling.
    render(
      <InputGroup>
        <InputGroupInput aria-invalid placeholder="Search..." />
      </InputGroup>,
    )
    const input = screen.getByPlaceholderText("Search...")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveAttribute("data-slot", "input-group-control")
    expect(input.closest("[data-slot=input-group]")).toBe(screen.getByRole("group"))
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

  it("forwards each group size to the Button it is built on", () => {
    // The group runs its own size scale, so the geometry has to come from a real Button
    // size rather than from class-merge ordering beating Button's `md` default.
    render(
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="sm">Go</InputGroupButton>
          <InputGroupButton aria-label="Clear" size="icon-xs" />
        </InputGroupAddon>
      </InputGroup>,
    )
    expect(screen.getByRole("button", { name: "Go" })).toHaveClass("h-7")
    expect(screen.getByRole("button", { name: "Clear" })).toHaveClass("size-6")
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
