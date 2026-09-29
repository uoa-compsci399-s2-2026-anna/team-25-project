import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getMemberDetailsCached } from "../members.queries"
import { MemberBio, MemberBioSkeleton } from "./MemberDetailBio"

vi.mock("../members.queries", () => ({ getMemberDetailsCached: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("../actions/updateMemberBio", () => ({ updateMemberBio: vi.fn() }))

const renderBio = async () =>
  render(await MemberBio({ params: Promise.resolve({ memberId: "7" }) }))

describe("MemberBio", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
  })

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

  it("hides the edit control on someone else's profile", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue({ id: 7, bio: "Bio" } as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 8 },
    } as never)

    await renderBio()
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument()
  })

  it("shows the edit control on the member's own profile", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue({ id: 7, bio: "Bio" } as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 7 },
    } as never)

    await renderBio()
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
    expect(screen.getByText("Bio")).toBeInTheDocument()
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
