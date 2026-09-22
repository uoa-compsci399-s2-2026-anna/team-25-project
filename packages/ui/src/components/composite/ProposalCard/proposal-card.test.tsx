import { cleanup, render, screen } from "@testing-library/react"
import type * as React from "react"
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

  it("drops the posted date rather than throwing on an unparseable one", () => {
    render(<ProposalCard {...props} postedAt="not a date" />)

    expect(screen.queryByText(/^Posted/)).not.toBeInTheDocument()
    expect(screen.getByText(props.title)).toBeInTheDocument()
  })

  it("defaults to the active status", () => {
    render(<ProposalCard {...props} data-testid="card" />)

    expect(screen.getByTestId("card")).toHaveAttribute("data-status", "active")
    expect(screen.getByText("Active")).toHaveAttribute("data-variant", "active")
  })

  it("greys the card out when the proposal is closed", () => {
    render(<ProposalCard {...props} data-testid="card" status="closed" />)

    expect(screen.getByTestId("card")).toHaveAttribute("data-status", "closed")
    expect(screen.getByText("Closed")).toHaveAttribute("data-variant", "closed")
  })

  it("renders tags as badges, defaulting to the blue variant", () => {
    render(<ProposalCard {...props} tags={[{ label: "Assessment" }]} />)
    expect(screen.getByText("Assessment")).toHaveAttribute("data-variant", "blue")
  })

  it("honours a per-tag variant", () => {
    render(<ProposalCard {...props} tags={[{ label: "Multi-institution", variant: "salmon" }]} />)
    expect(screen.getByText("Multi-institution")).toHaveAttribute("data-variant", "salmon")
  })

  it("overrides tag variants while the proposal is closed", () => {
    render(
      <ProposalCard
        {...props}
        status="closed"
        tags={[{ label: "Multi-institution", variant: "salmon" }]}
      />,
    )
    expect(screen.getByText("Multi-institution")).toHaveAttribute("data-variant", "closed")
  })

  it("drops a repeated tag rather than rendering it twice", () => {
    render(<ProposalCard {...props} tags={[{ label: "Assessment" }, { label: "Assessment" }]} />)
    expect(screen.getAllByText("Assessment")).toHaveLength(1)
  })

  it("renders no tags when none are passed", () => {
    render(<ProposalCard {...props} />)
    expect(screen.queryByText("Assessment")).not.toBeInTheDocument()
  })

  it("falls back to the author's initials, skipping any title in their name", () => {
    render(<ProposalCard {...props} />)
    expect(screen.getByText("AT")).toBeInTheDocument()
  })

  it("falls back to a placeholder rather than an empty avatar for a blank name", () => {
    render(<ProposalCard {...props} author={{ name: "   " }} />)
    expect(screen.getByText("?")).toBeInTheDocument()
  })

  // Base UI only swaps the fallback out once the image loads, which jsdom never
  // reports, so the loaded avatar cannot be asserted. Same as avatar.test.tsx.
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

  it("renders the title as plain text when there is no href", () => {
    render(<ProposalCard {...props} />)
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("links the title to the href, named by the title alone", () => {
    render(<ProposalCard {...props} href="/proposals/fairness" />)
    expect(screen.getByRole("link", { name: props.title })).toHaveAttribute(
      "href",
      "/proposals/fairness",
    )
  })

  it("renders the link through a custom link component", () => {
    const CustomLink = ({ children, ...linkProps }: React.ComponentProps<"a">) => (
      <a data-testid="custom-link" {...linkProps}>
        {children}
      </a>
    )
    render(<ProposalCard {...props} href="/proposals/fairness" linkComponent={CustomLink} />)
    expect(screen.getByTestId("custom-link")).toHaveAttribute("href", "/proposals/fairness")
  })

  it("passes the size through to the card", () => {
    render(<ProposalCard {...props} data-testid="card" size="sm" />)
    expect(screen.getByTestId("card")).toHaveAttribute("data-size", "sm")
  })
})
