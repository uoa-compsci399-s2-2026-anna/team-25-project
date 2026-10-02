import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Logo } from "./Logo"

describe("Logo", () => {
  afterEach(() => {
    cleanup()
  })

  // Decorative, so it stays out of the accessibility tree entirely.
  it("is hidden from assistive technology", () => {
    const { container } = render(<Logo />)
    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("aria-hidden", "true")
    expect(svg).toHaveAttribute("role", "presentation")
  })

  it("merges a custom className", () => {
    const { container } = render(<Logo className="custom-size" />)
    expect(container.querySelector("svg")).toHaveClass("custom-size")
  })
})
