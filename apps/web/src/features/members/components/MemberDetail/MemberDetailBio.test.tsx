import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getMemberDetailsCached } from "../../members.queries"
import { EditButton } from "../MemberEditor/EditButton"
import { EditProvider } from "../MemberEditor/EditContext"
import { MemberBio, MemberBioSkeleton } from "./MemberDetailBio"

vi.mock("../../members.queries", () => ({ getMemberDetailsCached: vi.fn() }))
vi.mock("../../actions/updateMemberProfile", () => ({ updateMemberProfile: vi.fn() }))

// The page's Edit button lives in the header, so it's rendered alongside here.
// The component itself goes in its own element so tests can check just its output.
const renderBio = async () =>
  render(
    <EditProvider>
      <div data-testid="subject">
        {await MemberBio({ params: Promise.resolve({ memberId: "7" }) })}
      </div>
      <EditButton />
    </EditProvider>,
  )

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

  it.each([null, undefined, "", "   "])("renders nothing when the bio is %j", async (bio) => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue({ bio } as never)

    await renderBio()
    expect(screen.getByTestId("subject")).toBeEmptyDOMElement()
  })

  it("swaps the bio for a text area seeded with it when editing", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue({ id: 7, bio: "My bio" } as never)
    const user = userEvent.setup()

    await renderBio()
    await user.click(screen.getByRole("button", { name: "Edit" }))

    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveValue("My bio")
  })

  it("renders nothing when the member doesn't exist", async () => {
    vi.mocked(getMemberDetailsCached).mockResolvedValue(null)

    await renderBio()
    expect(screen.getByTestId("subject")).toBeEmptyDOMElement()
  })
})

describe("MemberBio skeleton", () => {
  it("renders a placeholder", () => {
    const { container } = render(<MemberBioSkeleton />)
    expect(container.firstElementChild).toBeInTheDocument()
    cleanup()
  })
})
