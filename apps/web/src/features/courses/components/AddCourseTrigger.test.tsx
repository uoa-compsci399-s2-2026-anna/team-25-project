import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { AddCourseTriggerWithDefaultRole } from "./AddCourseTrigger"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock("../actions/createCourse", () => ({ createCourse: vi.fn() }))

const renderTrigger = async () => render(await AddCourseTriggerWithDefaultRole())

const openDialog = async () => {
  await renderTrigger()
  fireEvent.click(screen.getByRole("button", { name: "+ Add your course" }))
}

describe("AddCourseTriggerWithDefaultRole", () => {
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

    expect(screen.getByLabelText("Your role")).toHaveValue("Senior Lecturer")
  })

  it("leaves Your role blank when the member has no position set", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      // biome-ignore lint/suspicious/noExplicitAny: minimal Member mock, only the fields read are relevant
      user: { id: 1, position: null } as any,
    })

    await openDialog()

    expect(screen.getByLabelText("Your role")).toHaveValue("")
  })

  it("leaves Your role blank for an admin, who has no profile position", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "admin",
      // biome-ignore lint/suspicious/noExplicitAny: minimal Admin mock, only the fields read are relevant
      user: { id: 1 } as any,
    })

    await openDialog()

    expect(screen.getByLabelText("Your role")).toHaveValue("")
  })
})
