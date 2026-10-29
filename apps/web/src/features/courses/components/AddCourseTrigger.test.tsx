import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { AddCourseTriggerForMember } from "./AddCourseTrigger"

vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock("../actions/createCourse", () => ({ createCourse: vi.fn() }))

const openDialog = async () => {
  render(await AddCourseTriggerForMember())
  fireEvent.click(screen.getByRole("button", { name: "+ Add your course" }))
}

// The role is seeded once the dialog opens, so a "blank" check has to let that
// settle first or it would pass before it ran.
const settle = () => act(async () => {})

describe("AddCourseTriggerForMember", () => {
  afterEach(() => {
    cleanup()
  })

  it("pre-fills Your role from the signed-in member's profile position", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      // biome-ignore lint/suspicious/noExplicitAny: minimal Member mock, only the fields read are relevant
      user: { id: 1, position: "Senior Lecturer" } as any,
    })

    await openDialog()

    await waitFor(() => {
      expect(screen.getByLabelText(/^Your role/)).toHaveValue("Senior Lecturer")
    })
  })

  it("leaves Your role blank when the member has no position set", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      // biome-ignore lint/suspicious/noExplicitAny: minimal Member mock, only the fields read are relevant
      user: { id: 1, position: null } as any,
    })

    await openDialog()
    await settle()

    expect(screen.getByLabelText(/^Your role/)).toHaveValue("")
  })

  it.each([
    ["an admin, who cannot add a course", { collection: "admin", user: { id: 1 } }],
    ["a signed-out visitor", { collection: null, user: null }],
  ])("hides the button from %s", async (_, current) => {
    vi.mocked(getCurrentUser).mockResolvedValue(current as never)

    expect(await AddCourseTriggerForMember()).toBeNull()
  })
})
