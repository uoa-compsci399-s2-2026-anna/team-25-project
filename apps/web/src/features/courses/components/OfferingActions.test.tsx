import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPublishedCourseCached, getPublishedOfferingsCached } from "../courses.queries"
import { OfferingActions } from "./OfferingActions"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("../courses.queries", () => ({
  getPublishedCourseCached: vi.fn(),
  getPublishedOfferingsCached: vi.fn(),
  getTeamMembers: vi.fn().mockResolvedValue([]),
}))
// The dialogs are covered on their own; stand-ins show which actions rendered.
vi.mock("./OfferingDialogs", () => ({
  AddOfferingDialog: () => <button type="button">Add offering</button>,
  EditOfferingDialog: () => <button type="button">Edit offering</button>,
}))
vi.mock("./DeleteCourseButtons", () => ({
  DeleteOfferingButton: ({ offeringId, period }: { offeringId: number; period: string }) => (
    <button type="button">{`Delete offering ${offeringId} (${period})`}</button>
  ),
}))

const offering = (id: number, period: string, startDate: string) => ({
  course: 4,
  endDate: null,
  id,
  period,
  startDate,
})

const asMember = (id: number) =>
  vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: { id } } as never)

const renderActions = async (offeringId?: number) => {
  const searchParams = Promise.resolve(offeringId ? { offering: String(offeringId) } : {})
  render(await OfferingActions({ courseId: 4, searchParams }))
}

describe("OfferingActions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getPublishedCourseCached).mockResolvedValue({
      editors: [8],
      id: 4,
      owner: 7,
    } as never)
    vi.mocked(getPublishedOfferingsCached).mockResolvedValue([
      offering(100, "Semester 1 2026", "2026-03-01"),
      offering(101, "Semester 2 2025", "2025-07-01"),
    ] as never)
  })

  afterEach(() => {
    cleanup()
  })

  it("lets the owner delete the offering being viewed", async () => {
    asMember(7)

    await renderActions(101)

    expect(
      screen.getByRole("button", { name: "Delete offering 101 (Semester 2 2025)" }),
    ).toBeInTheDocument()
  })

  it("doesn't offer to delete the course's only published offering", async () => {
    asMember(7)
    vi.mocked(getPublishedOfferingsCached).mockResolvedValue([
      offering(100, "Semester 1 2026", "2026-03-01"),
    ] as never)

    await renderActions()

    expect(screen.getByRole("button", { name: "Edit offering" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Delete offering/ })).not.toBeInTheDocument()
  })

  it("gives an editor who isn't the owner Edit and Add, but not Delete", async () => {
    asMember(8)

    await renderActions()

    expect(screen.getByRole("button", { name: "Edit offering" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add offering" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Delete offering/ })).not.toBeInTheDocument()
  })
})
