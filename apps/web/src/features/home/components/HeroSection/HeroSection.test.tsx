import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import { HeroSection } from "./HeroSection"

describe("HeroSection", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the eyebrow text", () => {
    render(<HeroSection />)
    expect(screen.getByText("Computing Capstone Community Australasia")).toBeInTheDocument()
  })

  it("renders the heading as an h1", () => {
    render(<HeroSection />)
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Join the Computing Capstone Community Australasia",
      }),
    ).toBeInTheDocument()
  })

  it("renders the description", () => {
    render(<HeroSection />)
    expect(
      screen.getByText(
        /Academics across Australian and New Zealand universities post research ideas/,
      ),
    ).toBeInTheDocument()
  })

  it("links Become a member to the register route", () => {
    render(<HeroSection />)
    expect(screen.getByRole("button", { name: "Become a member" })).toHaveAttribute(
      "href",
      Routes.REGISTER.ROOT,
    )
  })

  // The design replaced the two-button pair with a single call to action.
  it("renders only the one call to action", () => {
    render(<HeroSection />)
    expect(screen.getAllByRole("button")).toHaveLength(1)
  })
})
