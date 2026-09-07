import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Checkbox } from "./checkbox"

describe("Checkbox", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders unchecked by default", () => {
    render(<Checkbox aria-label="Accept terms" />)
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" })
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toHaveAttribute("aria-checked", "false")
  })

  it("renders checked when defaultChecked is passed", () => {
    render(<Checkbox aria-label="Accept terms" defaultChecked />)
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
  })

  it("calls onCheckedChange when clicked", () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Accept terms" onCheckedChange={onCheckedChange} />)
    fireEvent.click(screen.getByRole("checkbox", { name: "Accept terms" }))
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it("toggles aria-checked when clicked", () => {
    render(<Checkbox aria-label="Accept terms" />)
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" })
    fireEvent.click(checkbox)
    expect(checkbox).toHaveAttribute("aria-checked", "true")
    fireEvent.click(checkbox)
    expect(checkbox).toHaveAttribute("aria-checked", "false")
  })

  it("does not toggle or call onCheckedChange when disabled", () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Accept terms" disabled onCheckedChange={onCheckedChange} />)
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" })
    fireEvent.click(checkbox)
    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(checkbox).toHaveAttribute("aria-checked", "false")
    expect(checkbox).toHaveAttribute("data-disabled")
    expect(checkbox).toHaveAttribute("aria-disabled", "true")
  })

  it("shows a not-allowed cursor and dims when disabled", () => {
    render(<Checkbox aria-label="Accept terms" disabled />)
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" })
    expect(checkbox).toHaveClass("aria-disabled:cursor-not-allowed")
    expect(checkbox).toHaveClass("aria-disabled:opacity-50")
  })

  // jsdom can't evaluate :hover/CSS cascade, so this only guards against the
  // not-aria-disabled: prefix being dropped by accident, not the actual visual behavior.
  it("keeps the hover classes guarded by not-aria-disabled when disabled", () => {
    render(<Checkbox aria-label="Accept terms" disabled />)
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" })
    expect(checkbox).toHaveClass("not-aria-disabled:data-unchecked:hover:border-primary")
    expect(checkbox).toHaveClass("not-aria-disabled:data-checked:hover:bg-primary/80")
  })

  it("renders aria-checked=mixed and an indicator when indeterminate", () => {
    render(<Checkbox aria-label="Select all" indeterminate />)
    const checkbox = screen.getByRole("checkbox", { name: "Select all" })
    expect(checkbox).toHaveAttribute("aria-checked", "mixed")
    expect(checkbox.querySelector("[data-slot=checkbox-indicator]")).toBeInTheDocument()
  })

  it("keeps the indicator a fixed white instead of inheriting the root's transitioning color", () => {
    render(<Checkbox aria-label="Accept terms" defaultChecked />)
    const indicator = screen
      .getByRole("checkbox", { name: "Accept terms" })
      .querySelector("[data-slot=checkbox-indicator]")
    expect(indicator).toHaveClass("text-primary-foreground")
    expect(indicator).not.toHaveClass("text-current")
  })

  it("does not render an indicator when unchecked", () => {
    render(<Checkbox aria-label="Accept terms" />)
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" })
    expect(checkbox.querySelector("[data-slot=checkbox-indicator]")).not.toBeInTheDocument()
  })

  it("applies the base classes and data-slot attribute", () => {
    render(<Checkbox aria-label="Accept terms" />)
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" })
    expect(checkbox).toHaveClass("size-4", "rounded-[4px]", "border-input")
    expect(checkbox).toHaveAttribute("data-slot", "checkbox")
  })

  it("applies hover classes scoped to the unchecked and checked states", () => {
    render(<Checkbox aria-label="Accept terms" />)
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" })
    expect(checkbox).toHaveClass("not-aria-disabled:data-unchecked:hover:border-primary")
    expect(checkbox).toHaveClass("not-aria-disabled:data-checked:hover:bg-primary/80")
    expect(checkbox).toHaveAttribute("data-unchecked")
  })

  it("shows a pointer cursor when interactive", () => {
    render(<Checkbox aria-label="Accept terms" />)
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toHaveClass("cursor-pointer")
  })

  it("merges a custom className with the base classes", () => {
    render(<Checkbox aria-label="Accept terms" className="custom-class" />)
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toHaveClass("custom-class")
  })

  it("supports being used as a controlled component", () => {
    const onCheckedChange = vi.fn()
    const { rerender } = render(
      <Checkbox aria-label="Accept terms" checked={false} onCheckedChange={onCheckedChange} />,
    )
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" })
    fireEvent.click(checkbox)
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
    expect(checkbox).toHaveAttribute("aria-checked", "false")

    rerender(<Checkbox aria-label="Accept terms" checked onCheckedChange={onCheckedChange} />)
    expect(checkbox).toHaveAttribute("aria-checked", "true")
  })
})
