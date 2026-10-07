import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
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

  it("renders the globe", () => {
    render(<HeroSection />)
    expect(screen.getByLabelText("Globe - drag to rotate")).toBeInTheDocument()
  })

  // Registering is asked for in Who can join now, so the hero makes no second ask.
  it("renders no call to action", () => {
    render(<HeroSection />)
    expect(screen.queryAllByRole("button")).toHaveLength(0)
  })
})
