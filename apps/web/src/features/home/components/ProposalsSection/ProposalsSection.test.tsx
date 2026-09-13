import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ProposalsSection } from "./ProposalsSection"

describe("ProposalsSection", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the section heading as an h2", () => {
    render(<ProposalsSection />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Research proposals" }),
    ).toBeInTheDocument()
  })

  it("renders the ProposalsPreviewPlaceholder", () => {
    render(<ProposalsSection />)
    expect(
      screen.getByRole("heading", { level: 3, name: "Log in to see proposals available" }),
    ).toBeInTheDocument()
  })

  it("renders the ResearchIdeaCta", () => {
    render(<ProposalsSection />)
    expect(
      screen.getByRole("heading", { level: 3, name: "Have a research idea?" }),
    ).toBeInTheDocument()
  })
})
