import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { MemberEditProvider } from "@/features/members/components/MemberEditor/MemberEditProvider"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { MemberEditBar } from "./MemberDetailEditBar"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("../../actions/updateMemberProfile", () => ({ updateMemberProfile: vi.fn() }))
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

// The page wraps everything in MemberEditProvider, so the bar is rendered the same way.
const renderBar = async () =>
  render(
    <MemberEditProvider>
      {await MemberEditBar({ params: Promise.resolve({ memberId: "7" }) })}
    </MemberEditProvider>,
  )

describe("MemberEditBar", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows nothing to a signed-out visitor", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })

    const { container } = await renderBar()
    expect(container).toBeEmptyDOMElement()
  })

  it("shows nothing on someone else's profile", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 8 },
    } as never)

    const { container } = await renderBar()
    expect(container).toBeEmptyDOMElement()
  })

  it("shows nothing to a signed-in admin whose id happens to match", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "admin",
      user: { id: 7 },
    } as never)

    const { container } = await renderBar()
    expect(container).toBeEmptyDOMElement()
  })

  it("starts editing from the Edit profile button on the member's own profile", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 7 },
    } as never)
    const user = userEvent.setup()

    await renderBar()
    await user.click(screen.getByRole("button", { name: "Edit profile" }))

    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
  })
})
