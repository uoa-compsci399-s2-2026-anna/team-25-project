import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import { WhoCanJoinSection } from "./WhoCanJoinSection"

describe("WhoCanJoinSection", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the section heading", () => {
    render(<WhoCanJoinSection />)
    expect(screen.getByRole("heading", { level: 2, name: "Who can join" })).toBeInTheDocument()
  })

  it("lists who is eligible", () => {
    render(<WhoCanJoinSection />)
    expect(screen.getByText(/computing capstone courses/)).toBeInTheDocument()
    expect(screen.getByText(/Australia or New Zealand/)).toBeInTheDocument()
    expect(screen.getByText(/institutional email address/)).toBeInTheDocument()
  })

  // The steps happen in order, so the markup has to say so rather than just
  // drawing numbers beside them.
  it("gives the joining steps in order, as an ordered list", () => {
    render(<WhoCanJoinSection />)

    const steps = screen.getByRole("list", { name: "How joining works" })
    expect(steps.tagName).toBe("OL")
    expect(
      Array.from(steps.querySelectorAll("li"), (step) => step.querySelector("p")?.textContent),
    ).toEqual(["Pick your university", "Complete your profile"])
  })

  it("links the register button to the register flow", () => {
    render(<WhoCanJoinSection />)
    expect(screen.getByRole("button", { name: "Register with your uni email" })).toHaveAttribute(
      "href",
      Routes.REGISTER.ROOT,
    )
  })

  // The navbar is otherwise the only way in from this page.
  it("links Log in to the login flow", () => {
    render(<WhoCanJoinSection />)
    expect(screen.getByRole("button", { name: "Log in" })).toHaveAttribute("href", Routes.LOGIN)
  })
})
