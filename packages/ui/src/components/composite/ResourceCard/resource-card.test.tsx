import { cleanup, render, screen } from "@testing-library/react"
import type * as React from "react"
import { afterEach, describe, expect, it } from "vitest"
import { ResourceCard, type ResourceCardProps, ResourceCardSkeleton } from "./resource-card"

const props: ResourceCardProps = {
  owner: { name: "Dr Anna Tui" },
  sharedAt: "2026-06-03T00:00:00.000Z",
  title: "Individual contribution rubric for team projects",
}

describe("ResourceCard", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the title and who shared it when", () => {
    render(<ResourceCard {...props} />)

    expect(screen.getByText(props.title)).toBeInTheDocument()
    expect(screen.getByText(/Shared by Dr Anna Tui/)).toHaveTextContent(
      "Shared by Dr Anna Tui - Jun 2026",
    )
  })

  it.each([["2026-06-03T00:00:00.000Z"], [new Date("2026-06-03T00:00:00.000Z")]])(
    "formats %s as the month it was shared",
    (sharedAt) => {
      render(<ResourceCard {...props} sharedAt={sharedAt} />)
      expect(screen.getByText("Jun 2026")).toHaveAttribute("datetime", "2026-06-03T00:00:00.000Z")
    },
  )

  it("drops the date rather than throwing on an unparseable one", () => {
    render(<ResourceCard {...props} sharedAt="not a date" />)
    expect(screen.getByText(/Shared by/)).toHaveTextContent(/^Shared by Dr Anna Tui$/)
  })

  it("shows the related course as a badge", () => {
    render(<ResourceCard {...props} course="SE 101" />)
    expect(screen.getByText("SE 101")).toHaveAttribute("data-variant", "blue")
  })

  it("leaves the badge out when no course is linked", () => {
    render(<ResourceCard {...props} />)
    expect(document.querySelector("[data-slot=badge]")).not.toBeInTheDocument()
  })

  it("renders the summary when given", () => {
    render(<ResourceCard {...props} summary="Four-criterion rubric with moderation notes." />)
    expect(screen.getByText("Four-criterion rubric with moderation notes.")).toHaveClass(
      "line-clamp-2",
    )
  })

  it("links the title to the resource's detail page", () => {
    render(<ResourceCard {...props} href="/resources/1" />)
    expect(screen.getByRole("link", { name: props.title })).toHaveAttribute("href", "/resources/1")
  })

  it("leaves the title as text without a link", () => {
    render(<ResourceCard {...props} />)
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("links the byline to the owner's profile", () => {
    render(<ResourceCard {...props} owner={{ href: "/members/1", name: "Dr Anna Tui" }} />)
    expect(screen.getByRole("link", { name: /Shared by Dr Anna Tui/ })).toHaveAttribute(
      "href",
      "/members/1",
    )
  })

  it("falls back to the owner's initials without a photo", () => {
    render(<ResourceCard {...props} />)
    expect(screen.getByText("AT")).toBeInTheDocument()
  })

  it("renders links through a custom link component", () => {
    const Link = ({ children, ...rest }: React.ComponentProps<"a">) => (
      <a data-custom {...rest}>
        {children}
      </a>
    )
    render(
      <ResourceCard
        {...props}
        href="/resources/1"
        linkComponent={Link}
        owner={{ href: "/members/1", name: "Dr Anna Tui" }}
      />,
    )

    for (const link of screen.getAllByRole("link")) expect(link).toHaveAttribute("data-custom")
  })
})

describe("ResourceCardSkeleton", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders a placeholder card", () => {
    render(<ResourceCardSkeleton data-testid="skeleton" />)
    expect(screen.getByTestId("skeleton")).toHaveAttribute("data-slot", "resource-card-skeleton")
  })

  it("hides the placeholder from screen readers", () => {
    const { container } = render(<ResourceCardSkeleton />)

    // A loading card has nothing to read out, not even its divider.
    expect(screen.queryByRole("separator")).not.toBeInTheDocument()
    for (const box of container.querySelectorAll("[data-slot=skeleton]")) {
      expect(box).toHaveAttribute("aria-hidden", "true")
    }
  })
})
