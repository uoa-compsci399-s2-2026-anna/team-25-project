import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ProposalStatusRow } from "./ProposalStatusRow"

describe("ProposalStatusRow", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders an Active badge and the posted date", () => {
    render(
      <ProposalStatusRow
        createdAt="2026-08-03T00:00:00.000Z"
        status="active"
        updatedAt="2026-08-03T00:00:00.000Z"
      />,
    )
    expect(screen.getByText("Active")).toHaveAttribute("data-variant", "active")
    expect(screen.getByText("Posted 3 Aug 2026")).toBeInTheDocument()
  })

  it("renders a Closed badge", () => {
    render(
      <ProposalStatusRow
        createdAt="2026-08-03T00:00:00.000Z"
        status="closed"
        updatedAt="2026-08-03T00:00:00.000Z"
      />,
    )
    expect(screen.getByText("Closed")).toHaveAttribute("data-variant", "closed")
  })

  it("shows the updated date when it differs from the posted date", () => {
    render(
      <ProposalStatusRow
        createdAt="2026-08-03T00:00:00.000Z"
        status="active"
        updatedAt="2026-08-05T00:00:00.000Z"
      />,
    )
    expect(screen.getByText("updated 5 Aug 2026")).toBeInTheDocument()
  })

  it("hides the updated date when it's the same day as posted", () => {
    // these times both land on the same day once converted to NZ time
    render(
      <ProposalStatusRow
        createdAt="2026-08-03T00:00:00.000Z"
        status="active"
        updatedAt="2026-08-03T08:00:00.000Z"
      />,
    )
    expect(screen.queryByText(/updated/)).not.toBeInTheDocument()
  })
})
