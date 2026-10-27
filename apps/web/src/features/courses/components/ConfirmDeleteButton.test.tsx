import { toast } from "@repo/ui/components/ui"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ActionResult } from "@/features/auth/actions/types"
import { ConfirmDeleteButton } from "./ConfirmDeleteButton"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const onDelete = vi.fn<() => Promise<ActionResult>>()

const confirm = async () => {
  const user = userEvent.setup()
  render(
    <ConfirmDeleteButton
      deleted={{ description: "SE 101 was deleted.", title: "Course deleted" }}
      deletedHref="/courses"
      description="This deletes the course and all of its offerings."
      failureMessage="Could not delete this course. Try again."
      itemName="SE 101"
      label="Delete course"
      onDelete={onDelete}
    />,
  )
  await user.click(screen.getByRole("button", { name: "Delete course" }))
  return user
}

describe("ConfirmDeleteButton", () => {
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

  it("asks to confirm before deleting anything", async () => {
    await confirm()

    expect(screen.getByRole("dialog", { name: "Delete SE 101?" })).toHaveTextContent(
      "This deletes the course and all of its offerings.",
    )
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("closes without deleting when Keep is clicked", async () => {
    const user = await confirm()

    await user.click(screen.getByRole("button", { name: "Keep" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("deletes, shows the success toast and moves on", async () => {
    onDelete.mockResolvedValue({ ok: true })
    const user = await confirm()

    await user.click(screen.getByRole("button", { name: "Confirm delete" }))

    await waitFor(() => expect(push).toHaveBeenCalledWith("/courses"))
    expect(onDelete).toHaveBeenCalledOnce()
    expect(toast.add).toHaveBeenCalledWith({
      description: "SE 101 was deleted.",
      title: "Course deleted",
    })
  })

  it("shows the server's message and stays put when the delete is refused", async () => {
    onDelete.mockResolvedValue({ formError: "Only an admin can delete a course.", ok: false })
    const user = await confirm()

    await user.click(screen.getByRole("button", { name: "Confirm delete" }))

    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith({
        description: "Only an admin can delete a course.",
        title: "Delete failed",
      }),
    )
    expect(push).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Confirm delete" })).toBeEnabled()
  })

  it("shows the fallback message when the delete throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    onDelete.mockRejectedValue(new Error("network down"))
    const user = await confirm()

    await user.click(screen.getByRole("button", { name: "Confirm delete" }))

    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith({
        description: "Could not delete this course. Try again.",
        title: "Delete failed",
      }),
    )
    expect(push).not.toHaveBeenCalled()
  })

  it("disables both buttons while the delete runs", async () => {
    let finish: (value: ActionResult) => void = () => {}
    onDelete.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const user = await confirm()

    await user.click(screen.getByRole("button", { name: "Confirm delete" }))

    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Keep" })).toBeDisabled()
    await act(async () => finish({ ok: true }))
  })
})
