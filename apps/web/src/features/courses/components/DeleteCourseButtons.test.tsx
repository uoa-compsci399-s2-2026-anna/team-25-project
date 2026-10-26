import { toast } from "@repo/ui/components/ui"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { deleteCourse } from "../actions/deleteCourse"
import { DeleteCourseButton } from "./DeleteCourseButtons"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("../actions/deleteCourse", () => ({ deleteCourse: vi.fn() }))

const confirmDelete = async (label: string) => {
  const user = userEvent.setup()
  await user.click(screen.getByRole("button", { name: label }))
  await user.click(screen.getByRole("button", { name: "Confirm delete" }))
}

describe("DeleteCourseButtons", () => {
  beforeEach(() => {
    vi.spyOn(toast, "add")
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    act(() => {
      toast.close()
    })
  })

  it("deletes the course, then goes back to the courses list", async () => {
    vi.mocked(deleteCourse).mockResolvedValue({ ok: true })
    render(<DeleteCourseButton code="SE 101" courseId={4} />)

    await confirmDelete("Delete course")

    await waitFor(() => expect(push).toHaveBeenCalledWith("/courses"))
    expect(deleteCourse).toHaveBeenCalledWith({ courseId: 4 })
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "Course deleted" }))
  })
})
