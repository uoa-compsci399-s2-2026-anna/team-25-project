import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { MemberBenefitCard } from "./MemberBenefitCard"

describe("MemberBenefitCard", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the title as an h4", () => {
    render(
      <MemberBenefitCard
        description="Find academics by university, role and research interest."
        swatchClassName="bg-brand-salmon"
        title="Member directory"
      />,
    )
    expect(screen.getByRole("heading", { level: 4, name: "Member directory" })).toBeInTheDocument()
  })

  it("renders the description", () => {
    render(
      <MemberBenefitCard
        description="Find academics by university, role and research interest."
        swatchClassName="bg-brand-salmon"
        title="Member directory"
      />,
    )
    expect(
      screen.getByText("Find academics by university, role and research interest."),
    ).toBeInTheDocument()
  })

  it("does not render the MEMBERS badge when membersOnly is not set", () => {
    render(
      <MemberBenefitCard
        description="Find academics by university, role and research interest."
        swatchClassName="bg-brand-salmon"
        title="Member directory"
      />,
    )
    expect(screen.queryByText("MEMBERS")).not.toBeInTheDocument()
  })

  it("renders the MEMBERS badge when membersOnly is true", () => {
    render(
      <MemberBenefitCard
        description="Post a research idea, mark it active or closed, and gather interest from other institutions."
        membersOnly
        swatchClassName="bg-violet-200"
        title="Research proposals"
      />,
    )
    expect(screen.getByText("MEMBERS")).toBeInTheDocument()
  })
})
