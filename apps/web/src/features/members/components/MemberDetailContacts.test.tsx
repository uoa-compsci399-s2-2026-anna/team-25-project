import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getMemberDetailsCached } from "../member.queries"
import { MemberContacts, MemberContactsSkeleton } from "./MemberDetailContacts"

vi.mock("../member.queries", () => ({ getMemberDetailsCached: vi.fn() }))

const member = (showEmailPublicly: boolean) => ({
  id: 7,
  email: "anna.tui@auckland.ac.nz",
  showEmailPublicly,
})

const renderContacts = async () =>
  render(await MemberContacts({ params: Promise.resolve({ memberId: "7" }) }))

describe("MemberContacts", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows an opted-in email as a mailto link", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member(true) as never)

    await renderContacts()
    expect(screen.getByRole("link", { name: "anna.tui@auckland.ac.nz" })).toHaveAttribute(
      "href",
      "mailto:anna.tui@auckland.ac.nz",
    )
  })

  it("hides an email that isn't opted in", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member(false) as never)

    await renderContacts()
    expect(screen.queryByText("anna.tui@auckland.ac.nz")).not.toBeInTheDocument()
  })

  it("shows the staff page and ORCID links", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member(false) as never)

    await renderContacts()
    expect(screen.getByRole("link", { name: "Staff page" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "ORCID" })).toBeInTheDocument()
  })

  it("renders nothing when the member doesn't exist", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(null)

    const { container } = await renderContacts()
    expect(container).toBeEmptyDOMElement()
  })
})

describe("MemberContactsSkeleton", () => {
  it("renders a placeholder", () => {
    const { container } = render(<MemberContactsSkeleton />)
    expect(container.firstElementChild).toBeInTheDocument()
    cleanup()
  })
})
