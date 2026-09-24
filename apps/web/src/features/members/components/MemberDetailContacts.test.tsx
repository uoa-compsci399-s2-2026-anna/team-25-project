import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getMemberDetailsCached } from "../members.queries"
import { MemberContacts, MemberContactsSkeleton } from "./MemberDetailContacts"

vi.mock("../members.queries", () => ({ getMemberDetailsCached: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const member = (showEmailPublicly: boolean) => ({
  id: 7,
  email: "anna.tui@auckland.ac.nz",
  showEmailPublicly,
})

const signedOut = { collection: null, user: null }
const signedIn = { collection: "members", user: { id: 42 } }

const renderContacts = async () =>
  render(await MemberContacts({ params: Promise.resolve({ memberId: "7" }) }))

describe("MemberContacts", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockResolvedValue(signedOut as never)
  })

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

  it("hides an email that isn't opted in from signed-out visitors", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member(false) as never)

    await renderContacts()
    expect(screen.queryByText("anna.tui@auckland.ac.nz")).not.toBeInTheDocument()
  })

  // The checkbox only governs signed-out visitors, matching canReadEmail.
  it.each([
    ["isn't", false],
    ["is", true],
  ])("shows the email to signed-in users whether or not it %s opted in", async (_, optedIn) => {
    vi.mocked(getCurrentUser).mockResolvedValue(signedIn as never)
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member(optedIn) as never)

    await renderContacts()
    expect(screen.getByRole("link", { name: "anna.tui@auckland.ac.nz" })).toBeInTheDocument()
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
