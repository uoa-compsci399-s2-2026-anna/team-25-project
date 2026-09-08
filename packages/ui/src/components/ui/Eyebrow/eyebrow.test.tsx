import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Eyebrow } from "./eyebrow"

describe("Eyebrow", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders children", () => {
    render(<Eyebrow>Label</Eyebrow>)
    expect(screen.getByText("Label")).toBeInTheDocument()
  })

  it("renders a p tag by default", () => {
    render(<Eyebrow>Label</Eyebrow>)
    expect(screen.getByText("Label").tagName).toBe("P")
  })

  it("applies the base classes", () => {
    render(<Eyebrow>Label</Eyebrow>)
    expect(screen.getByText("Label")).toHaveClass(
      "text-xs",
      "font-semibold",
      "uppercase",
      "tracking-widest",
      "text-primary",
      "md:text-sm",
    )
  })

  it("merges a custom className with the base classes", () => {
    render(<Eyebrow className="custom-class">Label</Eyebrow>)
    expect(screen.getByText("Label")).toHaveClass("custom-class", "text-primary")
  })

  it("exposes the eyebrow data-slot", () => {
    render(<Eyebrow data-testid="eyebrow">Label</Eyebrow>)
    expect(screen.getByTestId("eyebrow")).toHaveAttribute("data-slot", "eyebrow")
  })

  it("forwards arbitrary props", () => {
    render(
      <Eyebrow aria-label="Section label" data-testid="eyebrow">
        Label
      </Eyebrow>,
    )
    expect(screen.getByTestId("eyebrow")).toHaveAttribute("aria-label", "Section label")
  })
})
