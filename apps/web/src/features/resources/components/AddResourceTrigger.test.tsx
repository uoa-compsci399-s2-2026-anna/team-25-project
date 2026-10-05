import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getEditableCourseOptions } from "../resources.queries"
import { AddResourceDialog } from "./AddResourceDialog"
import { AddResourceTriggerWithCourses } from "./AddResourceTrigger"

vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("../resources.queries", () => ({ getEditableCourseOptions: vi.fn() }))
vi.mock("./AddResourceDialog", () => ({
  AddResourceDialog: vi.fn(() => <button type="button">+ Contribute a resource</button>),
  AddResourceTriggerButton: () => null,
}))

type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>

describe("AddResourceTriggerWithCourses", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("gives the dialog the courses the member owns or edits", async () => {
    const courses = [{ label: "COMPSCI 399 - University of Auckland", value: 9 }]
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 7 },
    } as unknown as CurrentUser)
    vi.mocked(getEditableCourseOptions).mockResolvedValue(courses)

    render(await AddResourceTriggerWithCourses())

    expect(getEditableCourseOptions).toHaveBeenCalledWith(7)
    expect(AddResourceDialog).toHaveBeenCalledWith({ courses }, undefined)
    expect(screen.getByRole("button", { name: "+ Contribute a resource" })).toBeInTheDocument()
  })

  it("offers no courses to an admin, who cannot share a resource", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "admin",
      user: { id: 1 },
    } as unknown as CurrentUser)

    render(await AddResourceTriggerWithCourses())

    expect(getEditableCourseOptions).not.toHaveBeenCalled()
    expect(AddResourceDialog).toHaveBeenCalledWith({ courses: [] }, undefined)
  })
})
