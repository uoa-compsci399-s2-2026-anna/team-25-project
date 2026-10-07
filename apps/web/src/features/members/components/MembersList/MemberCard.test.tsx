import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import { MemberCard } from "./MemberCard"

const renderCard = (researchInterests?: string[] | null) =>
  render(
    <MemberCard
      firstName="Anna"
      href={Routes.MEMBERS.MEMBER(1)}
      lastName="Tui"
      researchInterests={researchInterests}
    />,
  )

const interestText = () =>
  screen.getAllByRole("listitem").map((item) => item.textContent?.trim() ?? "")

describe("MemberCard research interests", () => {
  afterEach(() => {
    cleanup()
  })

  it("lists the interests a member has", () => {
    renderCard(["Assessment", "Teamwork"])

    expect(interestText()).toEqual(["Assessment", "Teamwork"])
  })

  it.each([[undefined], [null], [[]], [["  "]]])(
    "renders no interest list for %s",
    (researchInterests) => {
      renderCard(researchInterests)

      expect(screen.queryByRole("listitem")).not.toBeInTheDocument()
    },
  )

  it("caps the list and counts the rest, so a long list cannot swamp the card", () => {
    renderCard(["Assessment", "Teamwork", "Ethics", "Curriculum", "Industry"])

    expect(interestText()).toEqual(["Assessment", "Teamwork", "Ethics", "+2"])
  })

  it("drops blanks and repeats before counting", () => {
    renderCard(["Assessment", "Assessment", "  ", "Teamwork"])

    expect(interestText()).toEqual(["Assessment", "Teamwork"])
  })

  it("still shows the member when they list no interests", () => {
    renderCard(null)

    expect(screen.getByText("Anna Tui")).toBeInTheDocument()
  })
})
