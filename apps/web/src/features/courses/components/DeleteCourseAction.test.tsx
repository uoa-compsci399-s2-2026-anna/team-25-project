import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { DeleteCourseAction } from "./DeleteCourseAction"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("../actions/deleteCourse", () => ({ deleteCourse: vi.fn() }))

describe("DeleteCourseAction", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows Delete course to an admin", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 1 } } as never)

    render(await DeleteCourseAction({ code: "SE 101", courseId: 4 }))

    expect(screen.getByRole("button", { name: "Delete course" })).toBeInTheDocument()
  })

  it.each([
    ["a member, even the course's owner", { collection: "members", user: { id: 7 } }],
    ["a signed-out visitor", { collection: null, user: null }],
  ])("shows nothing to %s", async (_, current) => {
    vi.mocked(getCurrentUser).mockResolvedValue(current as never)

    expect(await DeleteCourseAction({ code: "SE 101", courseId: 4 })).toBeNull()
  })
})
