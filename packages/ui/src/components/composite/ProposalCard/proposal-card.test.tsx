import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ProposalCard, type ProposalCardProps } from "./proposal-card"

const props: ProposalCardProps = {
  author: { institution: "University of Example", name: "Dr Anna Tui" },
  postedAt: "2026-08-03T00:00:00.000Z",
  summary: "Seeking two co-investigators with access to multi-year peer-assessment data.",
  title: "Longitudinal study of team assessment fairness in capstone cohorts",
}

describe("ProposalCard", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the title, summary and author", () => {
    render(<ProposalCard {...props} />)

    expect(screen.getByText(props.title)).toBeInTheDocument()
    expect(screen.getByText(props.summary)).toBeInTheDocument()
    expect(screen.getByText("Dr Anna Tui - University of Example")).toBeInTheDocument()
  })

  it("renders the author alone when there is no institution", () => {
    render(<ProposalCard {...props} author={{ name: "Dr Anna Tui" }} />)
    expect(screen.getByText("Dr Anna Tui")).toBeInTheDocument()
  })

  it.each([["2026-08-03T00:00:00.000Z"], [new Date("2026-08-03T00:00:00.000Z")]])(
    "formats %s as a posted date",
    (postedAt) => {
      render(<ProposalCard {...props} postedAt={postedAt} />)
      expect(screen.getByText("Posted 3 Aug 2026")).toBeInTheDocument()
    },
  )

  it("defaults to the active status", () => {
    render(<ProposalCard {...props} data-testid="card" />)

    expect(screen.getByTestId("card")).toHaveAttribute("data-status", "active")
    expect(screen.getByText("Active")).toHaveClass("bg-brand-salmon", "text-brand-plum")
  })

  it("greys the card out when the proposal is closed", () => {
    render(<ProposalCard {...props} data-testid="card" status="closed" />)

    expect(screen.getByTestId("card")).toHaveAttribute("data-status", "closed")
    expect(screen.getByTestId("card")).toHaveClass("data-[status=closed]:text-neutral-400")
    expect(screen.getByText("Closed")).toHaveClass("bg-neutral-100", "text-neutral-400")
  })

  it("renders tags as badges, defaulting to the blue variant", () => {
    render(<ProposalCard {...props} tags={[{ label: "Assessment" }]} />)
    expect(screen.getByText("Assessment")).toHaveClass("bg-brand-slate/15", "text-brand-slate")
  })

  it("honours a per-tag variant", () => {
    render(<ProposalCard {...props} tags={[{ label: "Multi-institution", variant: "salmon" }]} />)
    expect(screen.getByText("Multi-institution")).toHaveClass("bg-brand-salmon")
  })

  it("overrides tag variants while the proposal is closed", () => {
    render(
      <ProposalCard
        {...props}
        status="closed"
        tags={[{ label: "Multi-institution", variant: "salmon" }]}
      />,
    )
    expect(screen.getByText("Multi-institution")).toHaveClass("bg-neutral-100", "text-neutral-400")
  })

  it("renders no tags when none are passed", () => {
    render(<ProposalCard {...props} />)
    expect(screen.queryByText("Assessment")).not.toBeInTheDocument()
  })

  it("falls back to the author's initials, skipping any title in their name", () => {
    render(<ProposalCard {...props} />)
    expect(screen.getByText("AT")).toBeInTheDocument()
  })

  // Base UI only swaps the fallback out once the browser reports the image as
  // loaded, which jsdom never does, so the loaded avatar itself cannot be
  // asserted here. See avatar.test.tsx for the same limitation.
  it("keeps the initials showing until the author's avatar loads", () => {
    render(<ProposalCard {...props} author={{ ...props.author, avatarSrc: "/anna.png" }} />)
    expect(screen.getByText("AT")).toBeVisible()
  })

  it("merges a custom className and forwards container props", () => {
    render(
      <ProposalCard {...props} aria-label="Proposal" className="custom-class" data-testid="card" />,
    )

    expect(screen.getByTestId("card")).toHaveClass("custom-class")
    expect(screen.getByTestId("card")).toHaveAttribute("aria-label", "Proposal")
  })

  it("passes the size through to the card", () => {
    render(<ProposalCard {...props} data-testid="card" size="sm" />)
    expect(screen.getByTestId("card")).toHaveAttribute("data-size", "sm")
  })
})
