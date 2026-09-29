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

  it("renders AboutSection", () => {
    render(<Page />)
    expect(screen.getByRole("heading", { level: 2, name: "About us" })).toBeInTheDocument()
  })

  it("renders BenefitsSection", () => {
    render(<Page />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Benefits of being a member" }),
    ).toBeInTheDocument()
  })

  it("renders JoinCommunityBand", () => {
    render(<Page />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Want to be a part of the community?" }),
    ).toBeInTheDocument()
  })

  // The order the design lays them out in.
  it("renders the sections in order", () => {
    render(<Page />)
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "About us",
      "Benefits of being a member",
      "Want to be a part of the community?",
    ])
  })
})
