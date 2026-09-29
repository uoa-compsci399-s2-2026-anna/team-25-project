import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getMemberCoursesCached, getMemberDetailsCached } from "../../members.queries"
import { MemberStats, MemberStatsSkeleton } from "./MemberDetailStats"

vi.mock("../../members.queries", () => ({
  getMemberCoursesCached: vi.fn(),
  getMemberDetailsCached: vi.fn(),
}))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("../../actions/updateMemberResearchInterests", () => ({
  updateMemberResearchInterests: vi.fn(),
}))

const member = { id: 7, createdAt: "2026-03-01T00:00:00.000Z" }

const renderStats = async () =>
  render(await MemberStats({ params: Promise.resolve({ memberId: "7" }) }))

describe("MemberStats", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
  })

  afterEach(() => {
    cleanup()
  })

  it("lists each convened course with its period, code and name", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member as never)
    vi.mocked(getMemberCoursesCached).mockResolvedValue([
      { courseId: 12, code: "COMPSCI 399", name: "Capstone Project", period: "2026 Semester 2" },
    ])

    await renderStats()
    expect(screen.getByText("2026 Semester 2")).toBeInTheDocument()
    expect(screen.getByText("Capstone Project")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /COMPSCI 399/ })).toHaveAttribute("href", "/courses/12")
  })

  it("shows only the period when a course has no code or name", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member as never)
    vi.mocked(getMemberCoursesCached).mockResolvedValue([
      { courseId: 12, code: null, name: null, period: "2026 Semester 2" },
    ])

    await renderStats()
    expect(screen.getByRole("link")).toHaveTextContent(/^2026 Semester 2$/)
  })

  it("shows an empty state when the member convenes no courses", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member as never)
    vi.mocked(getMemberCoursesCached).mockResolvedValue([])

    await renderStats()
    expect(screen.getByText("No courses yet.")).toBeInTheDocument()
  })

  it("lists the member's research interests", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue({
      ...member,
      researchInterests: ["Code review", "Generative AI"],
    } as never)
    vi.mocked(getMemberCoursesCached).mockResolvedValue([])

    await renderStats()
    expect(screen.getByText("Code review")).toBeInTheDocument()
    expect(screen.getByText("Generative AI")).toBeInTheDocument()
    expect(screen.queryByText("No interests yet.")).not.toBeInTheDocument()
  })

  it("shows the research interests filler when there are none", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(member as never)
    vi.mocked(getMemberCoursesCached).mockResolvedValue([])

    await renderStats()
    expect(screen.getByText("No interests yet.")).toBeInTheDocument()
  })

  it("lets the member edit their own research interests", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue({
      ...member,
      researchInterests: ["Code review"],
    } as never)
    vi.mocked(getMemberCoursesCached).mockResolvedValue([])
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 7 },
    } as never)

    await renderStats()
    expect(screen.getByText("Code review")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
  })

  it("hides the edit control on someone else's profile", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue({
      ...member,
      researchInterests: ["Code review"],
    } as never)
    vi.mocked(getMemberCoursesCached).mockResolvedValue([])
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 8 },
    } as never)

    await renderStats()
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument()
  })

  it("dates membership from registration completion when there is one", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue({
      ...member,
      registrationCompletedAt: "2026-04-10T00:00:00.000Z",
    } as never)
    vi.mocked(getMemberCoursesCached).mockResolvedValue([])

    await renderStats()
    expect(screen.getByText("10 Apr 2026")).toBeInTheDocument()
  })

  it("falls back to the account creation date", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue({
      ...member,
      registrationCompletedAt: null,
    } as never)
    vi.mocked(getMemberCoursesCached).mockResolvedValue([])

    await renderStats()
    expect(screen.getByText("1 Mar 2026")).toBeInTheDocument()
  })

  it("leaves out Member since when there's no valid date", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue({ createdAt: "not a date" } as never)
    vi.mocked(getMemberCoursesCached).mockResolvedValue([])

    await renderStats()
    expect(screen.queryByText("Member since")).not.toBeInTheDocument()
  })

  it("renders nothing when the member doesn't exist", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(null)
    vi.mocked(getMemberCoursesCached).mockResolvedValue([])

    const { container } = await renderStats()
    expect(container).toBeEmptyDOMElement()
  })
})

describe("MemberStatsSkeleton", () => {
  it("renders a placeholder per card", () => {
    const { container } = render(<MemberStatsSkeleton />)
    expect(container.firstElementChild?.children).toHaveLength(3)
    cleanup()
  })
})
