import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import { BenefitsSection } from "./BenefitsSection"

describe("BenefitsSection", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the section heading", () => {
    render(<BenefitsSection />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Benefits of being a member" }),
    ).toBeInTheDocument()
  })

  it("lists every benefit", () => {
    render(<BenefitsSection />)
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
    expect(screen.getByText(/Share ideas, join other projects/)).toBeInTheDocument()
  })

  it("links Log in and Register to the real routes", () => {
    render(<BenefitsSection />)
    expect(screen.getByRole("button", { name: "Log in" })).toHaveAttribute("href", Routes.LOGIN)
    expect(screen.getByRole("button", { name: "Register with your uni email" })).toHaveAttribute(
      "href",
      Routes.REGISTER.ROOT,
    )
  })
})
