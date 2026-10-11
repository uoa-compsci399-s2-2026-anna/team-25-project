import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
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

  // The pair that used to sit under the list moved to Who can join.
  it("asks for nothing, it only lists", () => {
    render(<BenefitsSection />)
    expect(screen.queryAllByRole("button")).toHaveLength(0)
  })
})
