import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { AboutSection } from "./AboutSection"

describe("AboutSection", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the section heading", () => {
    render(<AboutSection />)
    expect(screen.getByRole("heading", { level: 2, name: "About us" })).toBeInTheDocument()
  })

  it("renders a numbered card for each of the three things CCCA does", () => {
    render(<AboutSection />)
    for (const [number, title] of [
      ["01", "Member directory"],
      ["02", "Research proposals"],
      ["03", "Workshop"],
    ]) {
      expect(screen.getByText(number)).toBeInTheDocument()
      expect(screen.getByRole("heading", { level: 3, name: title })).toBeInTheDocument()
    }
  })
})
