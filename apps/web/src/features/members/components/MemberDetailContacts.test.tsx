import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getMemberDetailsCached } from "../members.queries"
import { MemberContacts, MemberContactsSkeleton } from "./MemberDetailContacts"

vi.mock("../members.queries", () => ({ getMemberDetailsCached: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const member = (showEmailPublicly: boolean, links: { label: string; url: string }[] = []) => ({
  id: 7,
  email: "anna.tui@auckland.ac.nz",
  links,
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

  it("links each of the member's websites in a new tab", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(
      member(false, [
        { label: "Staff page", url: "https://auckland.ac.nz/anna" },
        { label: "GitHub", url: "https://github.com/anna" },
      ]) as never,
    )

    await renderContacts()
    const staffPage = screen.getByRole("link", { name: "Staff page" })
    expect(staffPage).toHaveAttribute("href", "https://auckland.ac.nz/anna")
    expect(staffPage).toHaveAttribute("target", "_blank")
    expect(staffPage).toHaveAttribute("rel", "noopener noreferrer")
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/anna",
    )
  })

  it("shows no website links when the member hasn't added any", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member(false) as never)

    await renderContacts()
    expect(screen.queryAllByRole("link")).toHaveLength(0)
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
