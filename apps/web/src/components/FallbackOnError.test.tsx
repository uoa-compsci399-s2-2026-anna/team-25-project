import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { FallbackOnError } from "./FallbackOnError"

const Throws = (): never => {
  throw new Error("boom")
}

describe("FallbackOnError", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the children when they do not throw", () => {
    render(
      <FallbackOnError fallback={<p>Guest links</p>}>
        <p>Signed-in links</p>
      </FallbackOnError>,
    )
    expect(screen.getByText("Signed-in links")).toBeInTheDocument()
  })

  it("renders the fallback in place of children that throw", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <FallbackOnError fallback={<p>Guest links</p>}>
        <Throws />
      </FallbackOnError>,
    )
    expect(screen.getByText("Guest links")).toBeInTheDocument()
  })
})
