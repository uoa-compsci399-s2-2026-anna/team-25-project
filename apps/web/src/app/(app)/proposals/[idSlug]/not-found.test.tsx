import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import NotFound from "./not-found"

describe("proposal not-found page", () => {
  afterEach(() => {
    cleanup()
  })

  it("links back to the proposals list", () => {
    render(<NotFound />)
    expect(screen.getByRole("button", { name: "Browse proposals" })).toHaveAttribute(
      "href",
      Routes.PROPOSALS.ROOT,
    )
  })
})
