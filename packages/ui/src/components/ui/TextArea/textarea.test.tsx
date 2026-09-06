import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Textarea } from "./textarea"

describe("Textarea", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders with a placeholder", () => {
    render(<Textarea placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument()
  })

  it("calls onChange when typed into", () => {
    const onChange = vi.fn()
    render(<Textarea onChange={onChange} placeholder="Enter text..." />)
    fireEvent.change(screen.getByPlaceholderText("Enter text..."), {
      target: { value: "hello" },
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(screen.getByPlaceholderText("Enter text...")).toHaveValue("hello")
  })

  it("does not accept input when disabled", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Textarea disabled onChange={onChange} placeholder="Enter text..." />)
    const textarea = screen.getByPlaceholderText("Enter text...")
    await user.type(textarea, "hello")
    expect(onChange).not.toHaveBeenCalled()
    expect(textarea).toBeDisabled()
  })

  it("applies the base classes and data-slot attribute", () => {
    render(<Textarea placeholder="Enter text..." />)
    const textarea = screen.getByPlaceholderText("Enter text...")
    expect(textarea).toHaveClass("min-h-16", "rounded-md", "border-input")
    expect(textarea).toHaveAttribute("data-slot", "textarea")
  })

  it("applies aria-invalid destructive classes when invalid", () => {
    render(<Textarea aria-invalid placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText("Enter text...")).toHaveClass(
      "aria-invalid:border-destructive",
    )
  })

  it("merges a custom className with the base classes", () => {
    render(<Textarea className="custom-class" placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText("Enter text...")).toHaveClass("custom-class")
  })
})
