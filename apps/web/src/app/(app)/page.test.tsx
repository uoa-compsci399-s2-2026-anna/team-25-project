import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import Page from "./page"

describe("Home page", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders HeroSection", () => {
    render(<Page />)
    expect(screen.getByText("Computing Capstone Community Australasia")).toBeInTheDocument()
  })

  it("renders TickerPlaceholder", () => {
    render(<Page />)
    expect(screen.getByTestId("ticker-placeholder")).toBeInTheDocument()
  })

  it("renders MembersSection", () => {
    render(<Page />)
    expect(screen.getByRole("heading", { level: 2, name: "What members get" })).toBeInTheDocument()
  })

  it("renders ProposalsSection, including the ResearchIdeaCta", () => {
    render(<Page />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Research proposals" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 3, name: "Have a research idea?" }),
    ).toBeInTheDocument()
  })
})
