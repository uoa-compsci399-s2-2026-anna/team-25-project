import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Skeleton } from "./skeleton"

describe("Skeleton", () => {
  afterEach(() => {
    cleanup()
  })

  it("applies the base classes", () => {
    render(<Skeleton data-testid="skeleton" />)
    expect(screen.getByTestId("skeleton")).toHaveClass("animate-pulse", "rounded-md", "bg-muted")
  })

  it("merges a custom className with the base classes", () => {
    render(<Skeleton className="h-4 w-10" data-testid="skeleton" />)
    expect(screen.getByTestId("skeleton")).toHaveClass("animate-pulse", "h-4", "w-10")
  })

  it("exposes the skeleton data-slot", () => {
    render(<Skeleton data-testid="skeleton" />)
    expect(screen.getByTestId("skeleton")).toHaveAttribute("data-slot", "skeleton")
  })

  it("forwards arbitrary props", () => {
    render(<Skeleton aria-hidden="true" data-testid="skeleton" />)
    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true")
  })
})
