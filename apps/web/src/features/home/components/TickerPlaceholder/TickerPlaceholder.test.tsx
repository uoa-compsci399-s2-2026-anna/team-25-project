import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { TickerPlaceholder } from "./TickerPlaceholder"

describe("TickerPlaceholder", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders 8 placeholder pills", () => {
    const { container } = render(<TickerPlaceholder />)
    expect(container.firstElementChild?.children).toHaveLength(8)
  })
})
