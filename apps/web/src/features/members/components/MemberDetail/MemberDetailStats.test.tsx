import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getMemberCoursesCached, getMemberDetailsCached } from "../../members.queries"
import { EditButton } from "../MemberEditor/EditButton"
import { EditProvider } from "../MemberEditor/EditContext"
import { MemberStats, MemberStatsSkeleton } from "./MemberDetailStats"

vi.mock("../../members.queries", () => ({
  getMemberCoursesCached: vi.fn(),
  getMemberDetailsCached: vi.fn(),
}))
vi.mock("../../actions/updateMemberProfile", () => ({ updateMemberProfile: vi.fn() }))

const member = { id: 7, createdAt: "2026-03-01T00:00:00.000Z" }

// The page's Edit button lives in the header, so it's rendered alongside here.
// The component itself goes in its own element so tests can check just its output.
const renderStats = async () =>
  render(
    <EditProvider>
      <div data-testid="subject">
        {await MemberStats({ params: Promise.resolve({ memberId: "7" }) })}
      </div>
      <EditButton />
    </EditProvider>,
  )

describe("MemberStats", () => {
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

  it("swaps the research interests for editable tags when editing", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue({
      ...member,
      researchInterests: ["Code review"],
    } as never)
    vi.mocked(getMemberCoursesCached).mockResolvedValue([])
    const user = userEvent.setup()

    await renderStats()
    await user.click(screen.getByRole("button", { name: "Edit" }))

    expect(screen.getByRole("textbox", { name: "research interest 1" })).toHaveValue("Code review")
    expect(screen.getByRole("button", { name: "Add research interest" })).toBeInTheDocument()
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

    await renderStats()
    expect(screen.getByTestId("subject")).toBeEmptyDOMElement()
  })
})

describe("MemberStatsSkeleton", () => {
  it("renders a placeholder per card", () => {
    const { container } = render(<MemberStatsSkeleton />)
    expect(container.firstElementChild?.children).toHaveLength(3)
    cleanup()
  })
})
