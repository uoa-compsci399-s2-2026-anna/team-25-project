import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Spinner } from "./spinner"

describe("Spinner", () => {
  afterEach(() => {
    cleanup()
  })

  it("applies the base classes", () => {
    render(<Spinner data-testid="spinner" />)
    expect(screen.getByTestId("spinner")).toHaveClass("animate-spin", "text-muted-foreground")
  })

  it("exposes an accessible loading status", () => {
    render(<Spinner data-testid="spinner" />)
    const spinner = screen.getByTestId("spinner")
    expect(spinner).toHaveAttribute("role", "status")
    expect(spinner).toHaveAttribute("aria-label", "Loading")
  })

  it("exposes the spinner data-slot", () => {
    render(<Spinner data-testid="spinner" />)
    expect(screen.getByTestId("spinner")).toHaveAttribute("data-slot", "spinner")
  })

  it("defaults to the default size", () => {
    render(<Spinner data-testid="spinner" />)
    expect(screen.getByTestId("spinner")).toHaveClass("size-4")
  })

  it("applies the sm size variant", () => {
    render(<Spinner data-testid="spinner" size="sm" />)
    expect(screen.getByTestId("spinner")).toHaveClass("size-3")
  })

  it("applies the lg size variant", () => {
    render(<Spinner data-testid="spinner" size="lg" />)
    expect(screen.getByTestId("spinner")).toHaveClass("size-6")
  })

  it("merges a custom className with the base classes", () => {
    render(<Spinner className="text-primary" data-testid="spinner" />)
    expect(screen.getByTestId("spinner")).toHaveClass("animate-spin", "text-primary")
  })

  it("forwards arbitrary props", () => {
    render(<Spinner aria-hidden="true" data-testid="spinner" />)
    expect(screen.getByTestId("spinner")).toHaveAttribute("aria-hidden", "true")
  })

  it("lets a consumer override the default aria-label and role", () => {
    render(<Spinner aria-label="Fetching" data-testid="spinner" role="alert" />)
    const spinner = screen.getByTestId("spinner")
    expect(spinner).toHaveAttribute("aria-label", "Fetching")
    expect(spinner).toHaveAttribute("role", "alert")
  })
})
