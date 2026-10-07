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

  // The card it used to have its own slot for. It reads as part of 02 now.
  it("keeps course comparison on the proposals card", () => {
    render(<AboutSection />)
    expect(screen.getByText(/Record course data annually/)).toBeInTheDocument()
  })
})
