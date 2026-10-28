import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getInstitutionCached } from "@/features/institutions/institutions.queries"
import { MemberEditProvider } from "@/features/members/components/MemberEditor/MemberEditProvider"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getMemberDetailsCached } from "../../members.queries"
import { MemberHeader, MemberHeaderSkeleton } from "./MemberDetailHeader"

vi.mock("../../members.queries", () => ({ getMemberDetailsCached: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("../../actions/updateMemberProfile", () => ({ updateMemberProfile: vi.fn() }))
vi.mock("@/features/institutions/institutions.queries", () => ({
  getInstitutionCached: vi.fn(),
}))
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

const institution = { id: 12, name: "University of Auckland", country: "NZ" }

const member = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  firstName: "Anna",
  lastName: "Tui",
  position: "Senior Lecturer",
  institution: 12,
  avatar: null,
  ...overrides,
})

// The page wraps everything in MemberEditProvider, so the header is rendered the same way.
const renderHeader = async () =>
  render(
    <MemberEditProvider>
      {await MemberHeader({ params: Promise.resolve({ memberId: "7" }) })}
    </MemberEditProvider>,
  )

describe("MemberHeader", () => {
  beforeEach(() => {
    vi.mocked(getInstitutionCached)
      .mockReset()
      .mockResolvedValue(institution as never)
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
  })

  afterEach(() => {
    cleanup()
  })

  it("404s when the member doesn't exist", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(null)

    await expect(renderHeader()).rejects.toThrow("NEXT_NOT_FOUND")
  })

  it("shows the name and looks up the institution by id", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member() as never)

    const { container } = await renderHeader()
    expect(screen.getByRole("heading", { level: 1, name: "Anna Tui" })).toBeInTheDocument()
    expect(getInstitutionCached).toHaveBeenCalledWith(12)
    expect(container).toHaveTextContent("Senior Lecturer - University of Auckland - NZ")
  })

  it("shows the faculty and department on their own line", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(
      member({ department: "Computer Science", faculty: "Science" }) as never,
    )

    await renderHeader()
    expect(screen.getByText("Senior Lecturer - University of Auckland - NZ")).toBeInTheDocument()
    expect(screen.getByText("Science - Computer Science")).toBeInTheDocument()
  })

  it("shows only the faculty or department the member has", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member({ faculty: "Science" }) as never)

    await renderHeader()
    expect(screen.getByText("Science")).toBeInTheDocument()
  })

  it("leaves out the faculty line when there is neither", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member() as never)

    await renderHeader()
    const affiliationLine = screen.getByText("Senior Lecturer - University of Auckland - NZ")
    // Nothing follows the affiliation row, so no blank line adds space under it.
    expect(affiliationLine.parentElement?.nextElementSibling).toBeNull()
  })

  it("puts the member's title before their name", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member({ title: "assocProf" }) as never)

    await renderHeader()
    expect(
      screen.getByRole("heading", { level: 1, name: "Assoc Prof Anna Tui" }),
    ).toBeInTheDocument()
  })

  it("uses an already-populated institution without looking it up", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(
      member({ institution, position: null }) as never,
    )

    const { container } = await renderHeader()
    expect(getInstitutionCached).not.toHaveBeenCalled()
    expect(container).toHaveTextContent("University of Auckland - NZ")
    expect(container).not.toHaveTextContent("- University")
  })

  it("leaves out the affiliation line when there's nothing to show", async () => {
    vi.mocked(getInstitutionCached).mockResolvedValue(null)
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member({ position: null }) as never)

    const { container } = await renderHeader()
    expect(container.querySelector("p")).toBeNull()
  })

  it("hides the edit control on someone else's profile", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 8 },
    } as never)

    await renderHeader()
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Upload photo" })).not.toBeInTheDocument()
  })

  it("shows one Edit button on the member's own profile", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 7 },
    } as never)

    await renderHeader()
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1, name: "Anna Tui" })).toBeInTheDocument()
    // Inputs only appear once editing starts.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("swaps the photo, name, title and affiliation for inputs when editing", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(
      member({ department: "Computer Science", faculty: null }) as never,
    )
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 7 },
    } as never)
    const user = userEvent.setup()

    await renderHeader()
    await user.click(screen.getByRole("button", { name: "Edit" }))

    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Upload photo" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Title" })).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "First name" })).toHaveValue("Anna")
    expect(screen.getByRole("textbox", { name: "Last name" })).toHaveValue("Tui")
    expect(screen.getByRole("textbox", { name: "Position" })).toHaveValue("Senior Lecturer")
    expect(screen.getByRole("textbox", { name: "Department" })).toHaveValue("Computer Science")
    expect(screen.getByRole("textbox", { name: "Faculty" })).toHaveValue("")
  })

  it("tags the research interests under the name for phones, hidden from screen readers", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(
      member({ researchInterests: ["Peer review", "Team assessment"] }) as never,
    )

    await renderHeader()
    const tags = screen.getByText("Peer review").closest("ul")
    expect(tags).toHaveTextContent("Team assessment")
    // The Research interests section reads them out, so these would be a repeat.
    expect(tags).toHaveAttribute("aria-hidden", "true")
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })

  it("leaves out the interest tags when there are none", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member({ researchInterests: [] }) as never)

    const { container } = await renderHeader()
    expect(container.querySelector("ul")).toBeNull()
  })

  it("hides the interest tags while editing, as they're edited in their own section", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(
      member({ researchInterests: ["Peer review"] }) as never,
    )
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 7 },
    } as never)
    const user = userEvent.setup()

    await renderHeader()
    await user.click(screen.getByRole("button", { name: "Edit" }))

    expect(screen.queryByText("Peer review")).not.toBeInTheDocument()
  })

  it("falls back to initials without a populated avatar", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member({ avatar: 5 }) as never)

    await renderHeader()
    expect(screen.getByText("AT")).toBeInTheDocument()
  })

  it("falls back to initials when the avatar has no url", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(
      member({ avatar: { id: 5, url: null } }) as never,
    )

    await renderHeader()
    expect(screen.getByText("AT")).toBeInTheDocument()
  })

  it("renders with an avatar image url", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(
      member({ avatar: { id: 5, url: "/payload/api/media/file/anna.png" } }) as never,
    )

    await renderHeader()
    // The image only mounts once it loads, so the fallback shows in jsdom either way.
    expect(screen.getByText("AT")).toBeInTheDocument()
  })
})

describe("MemberHeaderSkeleton", () => {
  it("renders placeholders", () => {
    const { container } = render(<MemberHeaderSkeleton />)
    expect(container.firstElementChild).toBeInTheDocument()
    cleanup()
  })
})
