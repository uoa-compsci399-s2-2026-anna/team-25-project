import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { HeroGraphic } from "./HeroGraphic"

describe("HeroGraphic", () => {
  afterEach(() => {
    cleanup()
  })

  // Decorative, so it stays out of the accessibility tree entirely.
  it("is hidden from assistive technology", () => {
    const { container } = render(<HeroGraphic />)
    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("aria-hidden", "true")
    expect(svg).toHaveAttribute("role", "presentation")
  })

  it("merges a custom className", () => {
    const { container } = render(<HeroGraphic className="custom-size" />)
    expect(container.querySelector("svg")).toHaveClass("custom-size")
  })
})
