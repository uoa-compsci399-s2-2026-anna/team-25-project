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
        name: "Find collaborators for your next capstone project.",
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

  it("renders the placeholder graphic", () => {
    render(<HeroSection />)
    expect(screen.getByText("placeholder")).toBeInTheDocument()
  })

  it("links Browse proposals to the real proposals route", () => {
    render(<HeroSection />)
    expect(screen.getByRole("button", { name: "Browse proposals" })).toHaveAttribute(
      "href",
      Routes.PROPOSALS.ROOT,
    )
  })

  it("links Register with your uni email to the register route", () => {
    render(<HeroSection />)
    expect(screen.getByRole("button", { name: "Register with your uni email" })).toHaveAttribute(
      "href",
      Routes.REGISTER.ROOT,
    )
  })
})
