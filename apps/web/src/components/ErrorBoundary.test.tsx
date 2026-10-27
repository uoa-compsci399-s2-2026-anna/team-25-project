import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ErrorBoundary } from "./ErrorBoundary"

const Throws = (): never => {
  throw new Error("boom")
}

describe("ErrorBoundary", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows an ErrorState with a retry button in place of children that throw", () => {
    // React logs the caught error; keep the test output clean.
    vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <ErrorBoundary title="Could not load resources" variant="section">
        <Throws />
      </ErrorBoundary>,
    )
    expect(screen.getByText("Could not load resources")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})
