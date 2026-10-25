import { PublicationType } from "@repo/shared/enums/publications"
import { toast } from "@repo/ui/components/ui"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { deletePublication } from "../actions/deletePublication"
import type { FormValues } from "./AddPublicationForm"
import { PublicationCardActions } from "./PublicationCardActions"

const push = vi.fn()
const refresh = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }))
vi.mock("../actions/deletePublication", () => ({ deletePublication: vi.fn() }))
vi.mock("../actions/updatePublication", () => ({ updatePublication: vi.fn() }))

const initialValues: FormValues = {
  abstract: "",
  authors: [
    {
      id: "1",
      kind: "member",
      member: { firstName: "Anna", id: 10, lastName: "Tui", position: "Lecturer" },
      matched: false,
      memberId: 10,
      name: "Anna Tui",
    },
  ],
  citationKey: "",
  doi: "10.1145/1",
  issue: "",
  month: "",
  pages: "",
  publisher: "",
  tags: "",
  title: "Peer assessment in capstones",
  type: PublicationType.ARTICLE,
  url: "",
  venue: "",
  volume: "",
  year: 2025,
}

const openMenu = () =>
  fireEvent.click(screen.getByRole("button", { name: "Actions for Peer assessment in capstones" }))

describe("PublicationCardActions", () => {
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

  it("opens the edit dialog, prefilled with the publication's saved title", () => {
    render(
      <PublicationCardActions
        initialValues={initialValues}
        publicationId={3}
        title="Peer assessment in capstones"
      />,
    )
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }))

    expect(screen.getByRole("dialog", { name: "Edit publication" })).toBeInTheDocument()
    expect(screen.getByDisplayValue("Peer assessment in capstones")).toBeInTheDocument()
  })

  it("deletes and refreshes the list when Confirm delete succeeds", async () => {
    vi.mocked(deletePublication).mockResolvedValue({ ok: true })
    render(
      <PublicationCardActions
        initialValues={initialValues}
        publicationId={3}
        title="Peer assessment in capstones"
      />,
    )
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm delete" }))

    await waitFor(() => expect(deletePublication).toHaveBeenCalledWith(3))
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Publication deleted" }),
    )
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("shows the failure message and doesn't refresh when delete fails", async () => {
    vi.mocked(deletePublication).mockResolvedValue({
      formError: "Only the linked authors or an admin can delete this publication.",
      ok: false,
    })
    render(
      <PublicationCardActions
        initialValues={initialValues}
        publicationId={3}
        title="Peer assessment in capstones"
      />,
    )
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm delete" }))

    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Only the linked authors or an admin can delete this publication.",
          title: "Delete failed",
        }),
      ),
    )
    expect(refresh).not.toHaveBeenCalled()
  })

  it("shows the failure message and doesn't refresh when deletePublication throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(deletePublication).mockRejectedValue(new Error("network down"))
    render(
      <PublicationCardActions
        initialValues={initialValues}
        publicationId={3}
        title="Peer assessment in capstones"
      />,
    )
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm delete" }))

    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Could not delete this publication. Try again.",
          title: "Delete failed",
        }),
      ),
    )
    expect(refresh).not.toHaveBeenCalled()
  })
})
