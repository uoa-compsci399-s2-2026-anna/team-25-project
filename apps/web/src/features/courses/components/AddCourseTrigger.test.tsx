import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { AddCourseTriggerWithDefaultRole } from "./AddCourseTrigger"

vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock("../actions/createCourse", () => ({ createCourse: vi.fn() }))

type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>

const renderTrigger = async () => render(await AddCourseTriggerWithDefaultRole())

const openDialog = async () => {
  await renderTrigger()
  fireEvent.click(screen.getByRole("button", { name: "+ Add your course" }))
}

// The role now streams in after the dialog is already mounted, so a "blank"
// check has to let the lookup settle first or it would pass before it ran.
const settle = () => act(async () => {})

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

    await waitFor(() => {
      expect(screen.getByLabelText("Your role")).toHaveValue("Senior Lecturer")
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

    expect(screen.getByLabelText("Your role")).toHaveValue("")
  })

  it("leaves Your role blank for an admin, who has no profile position", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "admin",
      // biome-ignore lint/suspicious/noExplicitAny: minimal Admin mock, only the fields read are relevant
      user: { id: 1 } as any,
    })

    await openDialog()
    await settle()

    expect(screen.getByLabelText("Your role")).toHaveValue("")
  })

  it("does not wait for the member lookup before the dialog can be opened and typed into", async () => {
    let resolveUser!: (value: CurrentUser) => void
    vi.mocked(getCurrentUser).mockReturnValue(
      new Promise<CurrentUser>((resolve) => {
        resolveUser = resolve
      }),
    )

    await openDialog()

    expect(screen.getByRole("dialog", { name: "Add a capstone course" })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Course code"), { target: { value: "CS399" } })

    await act(async () => {
      resolveUser({
        collection: "members",
        // biome-ignore lint/suspicious/noExplicitAny: minimal Member mock, only the fields read are relevant
        user: { id: 1, position: "Senior Lecturer" } as any,
      })
    })

    // Same dialog instance throughout - the typed code survives the role arriving.
    expect(screen.getByLabelText("Course code")).toHaveValue("CS399")
    expect(screen.getByLabelText("Your role")).toHaveValue("Senior Lecturer")
  })
})
