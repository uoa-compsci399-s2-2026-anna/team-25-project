import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Separator } from "./divider"

describe("Separator", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders with the default horizontal orientation", () => {
    render(<Separator data-testid="separator" />)
    expect(screen.getByTestId("separator")).toHaveAttribute("data-orientation", "horizontal")
  })

  it("renders with a vertical orientation when passed", () => {
    render(<Separator data-testid="separator" orientation="vertical" />)
    expect(screen.getByTestId("separator")).toHaveAttribute("data-orientation", "vertical")
  })

  it("renders with the separator role and data-slot", () => {
    render(<Separator data-testid="separator" />)
    expect(screen.getByTestId("separator")).toHaveAttribute("role", "separator")
    expect(screen.getByTestId("separator")).toHaveAttribute("data-slot", "separator")
  })

  it("merges a custom className", () => {
    render(<Separator className="custom-class" data-testid="separator" />)
    expect(screen.getByTestId("separator")).toHaveClass("custom-class")
  })
})
