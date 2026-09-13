import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import { ResearchIdeaCta } from "./ResearchIdeaCta"

describe("ResearchIdeaCta", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the heading and supporting text", () => {
    render(<ResearchIdeaCta />)
    expect(
      screen.getByRole("heading", { level: 3, name: "Have a research idea?" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Post it as a proposal/)).toBeInTheDocument()
  })

  it("links Post a proposal to the proposals list as the closest existing page", () => {
    render(<ResearchIdeaCta />)
    expect(screen.getByRole("button", { name: "Post a proposal" })).toHaveAttribute(
      "href",
      Routes.PROPOSALS.ROOT,
    )
  })
})
