import { toast } from "@repo/ui/components/ui"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { deleteResource } from "../actions/deleteResource"
import { ResourceCardActions } from "./ResourceCardActions"

const push = vi.fn()
const refresh = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }))
vi.mock("../actions/deleteResource", () => ({ deleteResource: vi.fn() }))

const openMenu = () =>
  fireEvent.click(screen.getByRole("button", { name: "Actions for Contribution rubric" }))

describe("ResourceCardActions", () => {
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

  it("navigates to the edit href when Edit is clicked", () => {
    render(
      <ResourceCardActions
        editHref="/resources/1#edit"
        resourceId={1}
        title="Contribution rubric"
      />,
    )
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }))

    expect(push).toHaveBeenCalledWith("/resources/1#edit")
  })

  it("deletes and refreshes the list when Confirm delete succeeds", async () => {
    vi.mocked(deleteResource).mockResolvedValue({ ok: true })
    render(
      <ResourceCardActions
        editHref="/resources/1#edit"
        resourceId={1}
        title="Contribution rubric"
      />,
    )
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm delete" }))

    await waitFor(() => expect(deleteResource).toHaveBeenCalledWith(1))
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "Resource deleted" }))
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("shows the failure message and doesn't refresh when delete fails", async () => {
    vi.mocked(deleteResource).mockResolvedValue({
      formError: "Only the authors or an admin can delete this resource.",
      ok: false,
    })
    render(
      <ResourceCardActions
        editHref="/resources/1#edit"
        resourceId={1}
        title="Contribution rubric"
      />,
    )
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm delete" }))

    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Only the authors or an admin can delete this resource.",
          title: "Delete failed",
        }),
      ),
    )
    expect(refresh).not.toHaveBeenCalled()
  })

  it("shows the failure message and doesn't refresh when deleteResource throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(deleteResource).mockRejectedValue(new Error("network down"))
    render(
      <ResourceCardActions
        editHref="/resources/1#edit"
        resourceId={1}
        title="Contribution rubric"
      />,
    )
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm delete" }))

    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Could not delete this resource. Try again.",
          title: "Delete failed",
        }),
      ),
    )
    expect(refresh).not.toHaveBeenCalled()
  })
})
