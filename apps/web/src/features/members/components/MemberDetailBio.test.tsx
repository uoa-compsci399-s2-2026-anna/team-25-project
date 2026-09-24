import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getMemberDetailsCached } from "../members.queries"
import { MemberBio, MemberBioSkeleton } from "./MemberDetailBio"

vi.mock("../members.queries", () => ({ getMemberDetailsCached: vi.fn() }))

const renderBio = async () =>
  render(await MemberBio({ params: Promise.resolve({ memberId: "7" }) }))

describe("MemberBio", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the bio under About", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue({
      bio: "Researches peer assessment.",
    } as never)

    await renderBio()
    expect(screen.getByText("ABOUT")).toBeInTheDocument()
    expect(screen.getByText("Researches peer assessment.")).toBeInTheDocument()
  })

  it("renders nothing when the member doesn't exist", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(null)

    const { container } = await renderBio()
    expect(container).toBeEmptyDOMElement()
  })
})

describe("MemberBio skeleton", () => {
  it("renders a placeholder", () => {
    const { container } = render(<MemberBioSkeleton />)
    expect(container.firstElementChild).toBeInTheDocument()
    cleanup()
  })
})
