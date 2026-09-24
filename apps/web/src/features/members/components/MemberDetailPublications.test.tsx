import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { MemberPublications } from "./MemberDetailPublications"

describe("MemberPublications", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the placeholder publication card", () => {
    render(<MemberPublications />)

    expect(screen.getByRole("heading", { level: 2, name: "Publications" })).toBeInTheDocument()
    expect(screen.getByText("Publication")).toBeInTheDocument()
    expect(screen.getByText("Published —")).toBeInTheDocument()
    expect(screen.getByText("No publications yet")).toBeInTheDocument()
  })
})
