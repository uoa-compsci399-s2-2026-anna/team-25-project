import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Button } from "./button"

describe("Button", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders children", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument()
  })

  it("calls onClick when clicked", () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click me</Button>)
    fireEvent.click(screen.getByRole("button", { name: "Click me" }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Click me
      </Button>,
    )
    fireEvent.click(screen.getByRole("button", { name: "Click me" }))
    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Click me" })).toBeDisabled()
  })

  it("applies the default variant and size classes", () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole("button", { name: "Click me" })
    expect(button).toHaveClass("bg-primary", "text-primary-foreground", "h-8")
  })

  it("applies variant and size classes", () => {
    render(
      <Button size="lg" variant="destructive">
        Delete
      </Button>,
    )
    const button = screen.getByRole("button", { name: "Delete" })
    expect(button).toHaveClass("bg-destructive/10", "text-destructive", "h-9")
  })

  it("merges a custom className with variant classes", () => {
    render(<Button className="custom-class">Click me</Button>)
    expect(screen.getByRole("button", { name: "Click me" })).toHaveClass("custom-class")
  })
})
