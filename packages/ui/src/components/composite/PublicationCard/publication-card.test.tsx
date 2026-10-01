import type { Member, Publication } from "@repo/shared/payload-types"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import {
  PublicationCard,
  type PublicationCardProps,
  PublicationCardSkeleton,
} from "./publication-card"

const timestamp = "2026-03-01T00:00:00.000Z"

const publication: Publication = {
  authors: [{ name: "Anna Tui" }],
  createdAt: timestamp,
  id: 1,
  title: "Team assessment fairness in capstone cohorts",
  type: "article",
  updatedAt: timestamp,
  year: 2026,
}

const anna: Member = {
  collection: "members",
  createdAt: timestamp,
  email: "anna@example.com",
  firstName: "Anna",
  id: 1,
  institution: 1,
  lastName: "Tui",
  position: "Lecturer",
  updatedAt: timestamp,
}

const memberHref = (memberId: number) => `/members/${memberId}`

const renderCard = (
  overrides: Partial<Publication> = {},
  cardProps: Partial<PublicationCardProps> = {},
) =>
  render(
    <PublicationCard
      memberHref={memberHref}
      publication={{ ...publication, ...overrides }}
      {...cardProps}
    />,
  )

const CustomLink = ({ children, ...linkProps }: React.ComponentProps<"a">) => (
  <a data-testid="custom-link" {...linkProps}>
    {children}
  </a>
)

describe("PublicationCard", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the title, type label and year", () => {
    renderCard()

    expect(screen.getByText(publication.title)).toBeInTheDocument()
    expect(screen.getByText("Journal article")).toBeInTheDocument()
    expect(screen.getByText("Published 2026")).toBeInTheDocument()
  })

  it("adds the month to the published date when there is one", () => {
    renderCard({ month: 3 })
    expect(screen.getByText("Published Mar 2026")).toBeInTheDocument()
  })

  it("ignores a month out of range rather than rolling into another year", () => {
    renderCard({ month: 13 })
    expect(screen.getByText("Published 2026")).toBeInTheDocument()
  })

  it("renders the title as plain text when there is no url", () => {
    renderCard()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("links the title to the research website in a new tab", () => {
    renderCard({ url: "https://example.com/paper" })
    const link = screen.getByRole("link", { name: /opens in a new tab/ })

    expect(link).toHaveAttribute("href", "https://example.com/paper")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("links each author who is a member, and leaves the rest as text", () => {
    renderCard({ authors: [{ member: anna, name: "Anna Tui" }, { name: "Sam Lee" }] })

    expect(screen.getByRole("link", { name: "Anna Tui" })).toHaveAttribute("href", "/members/1")
    expect(screen.queryByRole("link", { name: "Sam Lee" })).not.toBeInTheDocument()
    expect(screen.getByText(/Sam Lee/)).toBeInTheDocument()
  })

  it("links a member the query left as an id", () => {
    renderCard({ authors: [{ member: 7, name: "Anna Tui" }] })
    expect(screen.getByRole("link", { name: "Anna Tui" })).toHaveAttribute("href", "/members/7")
  })

  it("leaves members as text when there is no memberHref", () => {
    renderCard({ authors: [{ member: anna, name: "Anna Tui" }] }, { memberHref: undefined })
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("shows an avatar beside linked authors only", () => {
    renderCard({ authors: [{ member: anna, name: "Dr Anna Tui" }, { name: "Sam Lee" }] })

    expect(screen.getByText("AT")).toBeInTheDocument()
    expect(screen.queryByText("SL")).not.toBeInTheDocument()
  })

  it("keeps the avatar out of the author link's name", () => {
    renderCard({ authors: [{ member: anna, name: "Anna Tui" }] })
    expect(screen.getByRole("link", { name: "Anna Tui" })).toBeInTheDocument()
  })

  // Base UI only swaps the fallback out once the image loads, which jsdom never
  // reports, so the loaded avatar cannot be asserted. Same as avatar.test.tsx.
  it("keeps the initials showing until a linked author's avatar loads", () => {
    const avatar = { alt: "", createdAt: timestamp, id: 1, updatedAt: timestamp, url: "/anna.png" }
    renderCard({ authors: [{ member: { ...anna, avatar }, name: "Anna Tui" }] })
    expect(screen.getByText("AT")).toBeVisible()
  })

  it("separates the authors with commas", () => {
    renderCard({ authors: [{ name: "Anna Tui" }, { name: "Sam Lee" }] })
    expect(screen.getByText(/Sam Lee/).closest("p")).toHaveTextContent("Anna Tui, Sam Lee")
  })

  it("keeps authors who share a name apart, each with their own link", () => {
    renderCard({
      authors: [
        { member: anna, name: "Anna Tui" },
        { member: 7, name: "Anna Tui" },
        { name: "Anna Tui" },
      ],
    })

    const links = screen.getAllByRole("link", { name: "Anna Tui" })

    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/members/1", "/members/7"])
    expect(links[0]?.closest("p")?.textContent?.match(/Anna Tui/g)).toHaveLength(3)
  })

  it("renders author links through a custom link component", () => {
    renderCard({ authors: [{ member: anna, name: "Anna Tui" }] }, { linkComponent: CustomLink })
    expect(screen.getByTestId("custom-link")).toHaveAttribute("href", "/members/1")
  })

  it("keeps the research website off the custom link component", () => {
    renderCard({ url: "https://example.com/paper" }, { linkComponent: CustomLink })
    expect(screen.queryByTestId("custom-link")).not.toBeInTheDocument()
  })

  it("links the DOI to doi.org", () => {
    renderCard({ doi: "10.1145/3313831.3376518" })
    expect(screen.getByRole("link", { name: /DOI 10\.1145\/3313831\.3376518/ })).toHaveAttribute(
      "href",
      "https://doi.org/10.1145/3313831.3376518",
    )
  })

  it("renders the venue and abstract when present", () => {
    renderCard({ abstract: "A study of peer marking.", venue: "ACM TOCE" })

    expect(screen.getByText("ACM TOCE")).toBeInTheDocument()
    expect(screen.getByText("A study of peer marking.")).toBeInTheDocument()
  })

  it("renders tags as blue badges", () => {
    renderCard({ tags: ["Assessment"] })
    expect(screen.getByText("Assessment")).toHaveAttribute("data-variant", "blue")
  })

  it("drops a repeated tag rather than rendering it twice", () => {
    renderCard({ tags: ["Assessment", "Assessment"] })
    expect(screen.getByText("Assessment")).toBeInTheDocument()
  })

  it("merges a custom className and forwards container props", () => {
    render(
      <PublicationCard
        aria-label="Publication"
        className="custom-class"
        data-testid="card"
        publication={publication}
      />,
    )

    expect(screen.getByTestId("card")).toHaveClass("custom-class")
    expect(screen.getByTestId("card")).toHaveAttribute("aria-label", "Publication")
  })

  it("passes the size through to the card", () => {
    render(<PublicationCard data-testid="card" publication={publication} size="sm" />)
    expect(screen.getByTestId("card")).toHaveAttribute("data-size", "sm")
  })
})

describe("PublicationCardSkeleton", () => {
  afterEach(() => {
    cleanup()
  })

  it("hides its placeholders from screen readers", () => {
    const { container } = render(<PublicationCardSkeleton />)
    const placeholders = container.querySelectorAll('[data-slot="skeleton"]')

    expect(placeholders.length).toBeGreaterThan(0)
    for (const placeholder of placeholders) {
      expect(placeholder).toHaveAttribute("aria-hidden", "true")
    }
  })

  it("passes the size through to the card", () => {
    render(<PublicationCardSkeleton data-testid="card" size="sm" />)
    expect(screen.getByTestId("card")).toHaveAttribute("data-size", "sm")
  })
})
