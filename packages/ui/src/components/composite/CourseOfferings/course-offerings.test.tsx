import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CourseOfferingSwitcher } from "./course-offering-switcher"
import {
  CourseOfferingList,
  type CourseOfferingListItem,
  CourseOfferingNotice,
  CourseOfferingPeriodBadge,
} from "./course-offerings"

const items: CourseOfferingListItem[] = [
  { id: 4, period: "Semester 1 2027", timing: "upcoming", href: "/courses/1?offering=4" },
  {
    id: 3,
    period: "Semester 2 2026",
    timing: "inProgress",
    href: "/courses/1",
    detail: "Jul - Nov",
  },
  { id: 1, period: "Semester 2 2025", timing: "ended", href: "/courses/1?offering=1" },
]

const CustomLink = ({ children, ...rest }: React.ComponentProps<"a">) => (
  <a data-custom {...rest}>
    {children}
  </a>
)

afterEach(() => {
  cleanup()
})

describe("CourseOfferingList", () => {
  it("links every offering and marks the selected one as the current page", () => {
    render(<CourseOfferingList items={items} selectedId={1} />)

    const links = screen.getAllByRole("link")
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/courses/1?offering=4",
      "/courses/1",
      "/courses/1?offering=1",
    ])
    expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("Semester 2 2025")
  })

  it("labels upcoming and in-progress offerings, and leaves ended ones plain", () => {
    render(<CourseOfferingList items={items} selectedId={3} />)

    expect(screen.getByRole("link", { name: /Semester 1 2027/ })).toHaveTextContent("Upcoming")
    expect(screen.getByRole("link", { name: /Semester 2 2026/ })).toHaveTextContent("In progress")
    expect(screen.getByRole("link", { name: /Semester 2 2025/ })).toHaveTextContent(
      /^Semester 2 2025$/,
    )
  })

  it("shows an item's detail line when it has one", () => {
    render(<CourseOfferingList items={items} selectedId={3} />)
    expect(screen.getByText("Jul - Nov")).toBeInTheDocument()
  })

  it("renders its links with the given link component", () => {
    render(<CourseOfferingList items={items} linkComponent={CustomLink} selectedId={3} />)
    for (const link of screen.getAllByRole("link")) expect(link).toHaveAttribute("data-custom")
  })
})

describe("CourseOfferingNotice", () => {
  it("names the offering being viewed and links back to the current one", () => {
    render(
      <CourseOfferingNotice
        currentHref="/courses/1"
        currentPeriod="Semester 2 2026"
        linkComponent={CustomLink}
        period="Semester 2 2025"
        timing="ended"
      />,
    )

    expect(screen.getByRole("status")).toHaveTextContent(
      "You're viewing the Semester 2 2025 offering.",
    )
    const link = screen.getByRole("link", { name: "View Semester 2 2026" })
    expect(link).toHaveAttribute("href", "/courses/1")
    expect(link).toHaveAttribute("data-custom")
  })

  it("says an upcoming offering hasn't started yet", () => {
    render(
      <CourseOfferingNotice
        currentHref="/courses/1"
        currentPeriod="Semester 2 2026"
        period="Semester 1 2027"
        timing="upcoming"
      />,
    )
    expect(screen.getByRole("status")).toHaveTextContent(
      "You're viewing the Semester 1 2027 offering, which hasn't started yet.",
    )
  })
})

describe("CourseOfferingPeriodBadge", () => {
  it("shows the period", () => {
    render(<CourseOfferingPeriodBadge period="Semester 2 2026" timing="inProgress" />)
    expect(screen.getByText("Semester 2 2026")).toBeInTheDocument()
  })
})

describe("CourseOfferingSwitcher", () => {
  it("lists every offering, flagging the upcoming and in-progress ones", async () => {
    const user = userEvent.setup()
    render(<CourseOfferingSwitcher onSelect={vi.fn()} options={items} selectedId={3} />)

    await user.click(screen.getByRole("combobox", { name: "Offering" }))

    expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual([
      "Semester 1 2027 (Upcoming)",
      "Semester 2 2026 (In progress)",
      "Semester 2 2025",
    ])
  })

  it("reports the picked offering's id", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<CourseOfferingSwitcher onSelect={onSelect} options={items} selectedId={3} />)

    await user.click(screen.getByRole("combobox", { name: "Offering" }))
    await user.click(await screen.findByRole("option", { name: "Semester 2 2025" }))

    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it("does nothing when the selected offering is picked again", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<CourseOfferingSwitcher onSelect={onSelect} options={items} selectedId={3} />)

    await user.click(screen.getByRole("combobox", { name: "Offering" }))
    await user.click(await screen.findByRole("option", { name: "Semester 2 2026 (In progress)" }))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it("marks itself busy while the caller acts on a pick", () => {
    render(<CourseOfferingSwitcher onSelect={vi.fn()} options={items} pending selectedId={3} />)
    expect(screen.getByRole("combobox", { name: "Offering" })).toHaveAttribute("aria-busy", "true")
  })
})
