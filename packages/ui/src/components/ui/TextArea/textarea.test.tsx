import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TextArea } from "./textarea"

describe("TextArea", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders with a placeholder", () => {
    render(<TextArea placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument()
  })

  it("calls onChange when typed into", () => {
    const onChange = vi.fn()
    render(<TextArea onChange={onChange} placeholder="Enter text..." />)
    fireEvent.change(screen.getByPlaceholderText("Enter text..."), {
      target: { value: "hello" },
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(screen.getByPlaceholderText("Enter text...")).toHaveValue("hello")
  })

  it("does not accept input when disabled", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TextArea disabled onChange={onChange} placeholder="Enter text..." />)
    const textarea = screen.getByPlaceholderText("Enter text...")
    await user.type(textarea, "hello")
    expect(onChange).not.toHaveBeenCalled()
    expect(textarea).toBeDisabled()
  })

  it("applies the base classes and data-slot attribute", () => {
    render(<TextArea placeholder="Enter text..." />)
    const textarea = screen.getByPlaceholderText("Enter text...")
    expect(textarea).toHaveClass("min-h-16", "rounded-md", "border-input")
    expect(textarea).toHaveAttribute("data-slot", "textarea")
  })

  it("defaults to the box variant and publishes it", () => {
    render(<TextArea placeholder="Enter text..." />)
    const textarea = screen.getByPlaceholderText("Enter text...")
    expect(textarea).toHaveAttribute("data-variant", "box")
    expect(textarea).toHaveClass("rounded-md", "bg-brand-cream/60")
  })

  it("softens the pill radius so a grown textarea keeps its corners off the text", () => {
    render(<TextArea placeholder="Enter text..." variant="pill" />)
    const textarea = screen.getByPlaceholderText("Enter text...")
    expect(textarea).toHaveAttribute("data-variant", "pill")
    expect(textarea).toHaveClass("rounded-2xl", "bg-transparent")
    expect(textarea).not.toHaveClass("rounded-full")
  })

  it("applies aria-invalid destructive classes when invalid", () => {
    render(<TextArea aria-invalid placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText("Enter text...")).toHaveClass(
      "aria-invalid:border-destructive",
    )
  })

  it("merges a custom className with the base classes", () => {
    render(<TextArea className="custom-class" placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText("Enter text...")).toHaveClass("custom-class")
  })
})
