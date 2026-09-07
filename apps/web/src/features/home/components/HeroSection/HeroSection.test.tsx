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
        /Academics across eight Australian and New Zealand universities post research ideas/,
      ),
    ).toBeInTheDocument()
  })

  it("renders the placeholder graphic", () => {
    render(<HeroSection />)
    expect(screen.getByText("placeholder")).toBeInTheDocument()
  })

  it("links Browse proposals to the real proposals route", () => {
    render(<HeroSection />)
    expect(screen.getByRole("link", { name: "Browse proposals" })).toHaveAttribute(
      "href",
      Routes.PROPOSALS.ROOT,
    )
  })

  it("renders Register with your uni email as a link", () => {
    render(<HeroSection />)
    expect(screen.getByRole("link", { name: "Register with your uni email" })).toHaveAttribute(
      "href",
      Routes.HOME,
    )
  })
})

describe("Routes", () => {
  it("builds a course route from an id", () => {
    expect(Routes.COURSES.COURSE("123")).toBe("/courses/123")
  })

  it("builds a member route from an id", () => {
    expect(Routes.MEMBERS.MEMBER("456")).toBe("/members/456")
  })

  it("builds a proposal route from an id", () => {
    expect(Routes.PROPOSALS.PROPOSAL("789")).toBe("/proposals/789")
  })
})
