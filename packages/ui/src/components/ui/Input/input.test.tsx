import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Input } from "./input"

describe("Input", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders with a placeholder", () => {
    render(<Input placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument()
  })

  it("calls onChange when typed into", () => {
    const onChange = vi.fn()
    render(<Input onChange={onChange} placeholder="Enter text..." />)
    fireEvent.change(screen.getByPlaceholderText("Enter text..."), {
      target: { value: "hello" },
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(screen.getByPlaceholderText("Enter text...")).toHaveValue("hello")
  })

  it("does not accept input when disabled", () => {
    const onChange = vi.fn()
    render(<Input disabled onChange={onChange} placeholder="Enter text..." />)
    const input = screen.getByPlaceholderText("Enter text...")
    fireEvent.change(input, { target: { value: "hello" } })
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toBeDisabled()
  })

  it("applies the base classes and data-slot attribute", () => {
    render(<Input placeholder="Enter text..." />)
    const input = screen.getByPlaceholderText("Enter text...")
    expect(input).toHaveClass("h-8", "rounded-lg", "border-input")
    expect(input).toHaveAttribute("data-slot", "input")
  })

  it("applies aria-invalid destructive classes when invalid", () => {
    render(<Input aria-invalid placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText("Enter text...")).toHaveClass(
      "aria-invalid:border-destructive",
    )
  })

  it("merges a custom className with the base classes", () => {
    render(<Input className="custom-class" placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText("Enter text...")).toHaveClass("custom-class")
  })
})
