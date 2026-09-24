import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getInstitutionCached } from "@/features/institutions/institutions.queries"
import { getMemberDetailsCached } from "../member.queries"
import { MemberHeader, MemberHeaderSkeleton } from "./MemberDetailHeader"

vi.mock("../member.queries", () => ({ getMemberDetailsCached: vi.fn() }))
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

const renderHeader = async () =>
  render(await MemberHeader({ params: Promise.resolve({ memberId: "7" }) }))

describe("MemberHeader", () => {
  beforeEach(() => {
    vi.mocked(getInstitutionCached)
      .mockReset()
      .mockResolvedValue(institution as never)
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

    await renderHeader()
    expect(screen.getByRole("heading", { level: 1, name: "Anna Tui" })).toBeInTheDocument()
    expect(getInstitutionCached).toHaveBeenCalledWith(12)
    expect(screen.getByText("Senior Lecturer - University of Auckland - NZ")).toBeInTheDocument()
  })

  it("uses an already-populated institution without looking it up", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(
      member({ institution, position: null }) as never,
    )

    await renderHeader()
    expect(getInstitutionCached).not.toHaveBeenCalled()
    expect(screen.getByText("University of Auckland - NZ")).toBeInTheDocument()
  })

  it("leaves out the affiliation line when there's nothing to show", async () => {
    vi.mocked(getInstitutionCached).mockResolvedValue(null)
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member({ position: null }) as never)

    const { container } = await renderHeader()
    expect(container.querySelector("p")).toBeNull()
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
