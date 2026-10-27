import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ErrorState } from "./ErrorState"

describe("ErrorState", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the default title when none is passed", () => {
    render(<ErrorState retry={() => {}} variant="section" />)
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
  })

  it("shows the title that is passed", () => {
    render(<ErrorState retry={() => {}} title="Could not load resources" variant="section" />)
    expect(screen.getByText("Could not load resources")).toBeInTheDocument()
  })

  it("calls retry when Try again is clicked", () => {
    const retry = vi.fn()
    render(<ErrorState retry={retry} variant="section" />)
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
