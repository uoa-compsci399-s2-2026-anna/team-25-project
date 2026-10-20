import type { Course } from "@repo/shared/payload-types"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { EditButton } from "@/components/Editor/EditButton"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { updateResource } from "../../actions/updateResource"
import { getEditableCourseOptions } from "../../resources.queries"
import { ResourceCourseEdit } from "./ResourceCourseEdit"
import { ResourceEditProvider } from "./ResourceEditProvider"

vi.mock("next/server", () => ({ connection: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("../../actions/updateResource", () => ({ updateResource: vi.fn() }))
vi.mock("../../resources.queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../resources.queries")>()),
  getEditableCourseOptions: vi.fn(),
}))

const linked = {
  code: "SE 101",
  id: 4,
  institution: { id: 12, name: "University of Auckland" },
} as Course

const member = { collection: "members", user: { id: 7 } }
const admin = { collection: "admin", user: { id: 1 } }

const renderEditor = async (course: Course | undefined = linked) => {
  const ui = await ResourceCourseEdit({ course, view: <span>Course view</span> })
  render(
    <ResourceEditProvider resourceId={3}>
      {ui}
      <EditButton />
    </ResourceEditProvider>,
  )
}

const openCourses = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Edit" }))
  await user.click(screen.getByRole("combobox", { name: "Course" }))
}

const optionNames = () => screen.getAllByRole("option").map((option) => option.textContent)

describe("ResourceCourseEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(member as never)
    vi.mocked(getEditableCourseOptions).mockResolvedValue([
      { label: "SE 101 - University of Auckland", value: 4 },
      { label: "SE 202 - University of Auckland", value: 5 },
    ])
    vi.mocked(updateResource).mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    cleanup()
  })

  it("shows the view until editing starts", async () => {
    await renderEditor()

    expect(screen.getByText("Course view")).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("lists the member's courses and saves the chosen course's id", async () => {
    const user = userEvent.setup()
    await renderEditor()

    await openCourses(user)
    expect(optionNames()).toEqual([
      "No course",
      "SE 101 - University of Auckland",
      "SE 202 - University of Auckland",
    ])

    await user.click(screen.getByRole("option", { name: "SE 202 - University of Auckland" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(updateResource).toHaveBeenCalledWith(3, { course: 5 })
  })

  it("saves null when the course is cleared", async () => {
    const user = userEvent.setup()
    await renderEditor()

    await openCourses(user)
    await user.click(screen.getByRole("option", { name: "No course" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(updateResource).toHaveBeenCalledWith(3, { course: null })
  })

  it("keeps the linked course listed once the member can no longer edit it", async () => {
    vi.mocked(getEditableCourseOptions).mockResolvedValue([
      { label: "SE 202 - University of Auckland", value: 5 },
    ])
    const user = userEvent.setup()
    await renderEditor()

    await user.click(screen.getByRole("button", { name: "Edit" }))
    expect(screen.getByRole("combobox", { name: "Course" })).toHaveTextContent(
      "SE 101 - University of Auckland",
    )
  })

  it("gives an admin only the linked course, as they own none", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(admin as never)
    const user = userEvent.setup()
    await renderEditor()

    await openCourses(user)
    expect(optionNames()).toEqual(["No course", "SE 101 - University of Auckland"])
    expect(getEditableCourseOptions).not.toHaveBeenCalled()
  })
})
