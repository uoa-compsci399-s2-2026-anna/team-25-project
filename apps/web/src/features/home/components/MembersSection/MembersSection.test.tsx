import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { MembersSection } from "./MembersSection"

describe("MembersSection", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the section heading as an h2", () => {
    render(<MembersSection />)
    expect(screen.getByRole("heading", { level: 2, name: "What members get" })).toBeInTheDocument()
  })

  it.each(["Member directory", "Research proposals", "Capstone course data"])(
    "renders the %s card",
    (title) => {
      render(<MembersSection />)
      expect(screen.getByRole("heading", { level: 3, name: title })).toBeInTheDocument()
    },
  )

  it("only shows the MEMBERS badge on the members-only cards", () => {
    render(<MembersSection />)
    expect(screen.getAllByText("MEMBERS")).toHaveLength(2)
  })
})
