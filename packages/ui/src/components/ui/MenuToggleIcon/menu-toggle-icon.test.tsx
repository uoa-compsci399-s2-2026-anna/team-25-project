import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { MenuToggleIcon } from "./menu-toggle-icon"

describe("MenuToggleIcon", () => {
  afterEach(() => {
    cleanup()
  })

  it("is hidden from assistive tech, since its button carries the label", () => {
    const { container } = render(<MenuToggleIcon open={false} />)
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true")
  })

  it("renders three bars", () => {
    const { container } = render(<MenuToggleIcon open={false} />)
    expect(container.firstChild?.childNodes).toHaveLength(3)
  })

  it("reports a closed state as a hamburger", () => {
    const { container } = render(<MenuToggleIcon open={false} />)
    expect(container.firstChild).toHaveAttribute("data-state", "closed")
  })

  it("reports an open state as an X", () => {
    const { container } = render(<MenuToggleIcon open />)
    expect(container.firstChild).toHaveAttribute("data-state", "open")
  })

  it("collapses the middle bar and crosses the outer two when open", () => {
    const { container } = render(<MenuToggleIcon open />)
    const [top, middle, bottom] = Array.from(container.firstChild?.childNodes ?? []) as Element[]
    expect(top).toHaveClass("rotate-45")
    expect(middle).toHaveClass("opacity-0")
    expect(bottom).toHaveClass("-rotate-45")
  })

  it("merges a custom className", () => {
    const { container } = render(<MenuToggleIcon className="size-8" open={false} />)
    expect(container.firstChild).toHaveClass("size-8")
  })
})
