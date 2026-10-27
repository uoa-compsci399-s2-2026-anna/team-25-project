import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { updateOffering } from "../actions/updateOffering"
import { EditOfferingDialog, type OfferingTeam } from "./OfferingDialogs"

vi.mock("../actions/createOffering", () => ({ createOffering: vi.fn() }))
vi.mock("../actions/deleteDraftOffering", () => ({ deleteDraftOffering: vi.fn() }))
vi.mock("../actions/searchMembers", () => ({ searchMembers: vi.fn() }))
vi.mock("../actions/updateDraftOffering", () => ({ updateDraftOffering: vi.fn() }))
vi.mock("../actions/updateOffering", () => ({ updateOffering: vi.fn() }))

const values = {
  additionalInfo: null,
  assessments: null,
  code: "",
  deliveryFormat: "online",
  endDate: "2026-11-06",
  learningOutcomes: null,
  name: "Capstone Project",
  period: "Semester 2 2026",
  programme: "BSc",
  projectType: "Industry",
  role: "",
  startDate: "2026-07-20",
}

const ada = { id: 7, firstName: "Ada", lastName: "Lovelace" }
const grace = { id: 8, firstName: "Grace", lastName: "Hopper" }

const openAndSave = async (team: OfferingTeam, edit?: () => void) => {
  vi.mocked(updateOffering).mockResolvedValue({ formError: "stop", ok: false })
  render(<EditOfferingDialog courseId={1} initialValues={values} offeringId={10} team={team} />)
  fireEvent.click(screen.getByRole("button", { name: "Edit offering" }))
  await screen.findByRole("button", { name: "Save changes" })
  edit?.()
  fireEvent.click(await screen.findByRole("button", { name: "Save changes" }))
  await waitFor(() => expect(updateOffering).toHaveBeenCalled())
  return vi.mocked(updateOffering).mock.calls[0][0] as Record<string, unknown>
}

describe("EditOfferingDialog teaching team", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  // Teaching staff may not change the team, so their saves keep the stored one.
  it("sends no team when the viewer cannot edit it", async () => {
    const sent = await openAndSave({ editable: false, rows: [{ member: ada, role: "Tutor" }] })

    expect(sent.teachingTeam).toBeUndefined()
  })

  // The stored team may have changed since the page loaded, so an untouched team is not sent.
  it("sends no team when the editor did not change it", async () => {
    const sent = await openAndSave({ editable: true, rows: [{ member: ada, role: "Tutor" }] })

    expect(sent.teachingTeam).toBeUndefined()
  })

  it("sends a changed team as member IDs and roles", async () => {
    const sent = await openAndSave(
      {
        editable: true,
        rows: [
          { member: ada, role: "Tutor" },
          { member: grace, role: "Lecturer" },
        ],
      },
      () => fireEvent.click(screen.getByRole("button", { name: "Remove Ada Lovelace" })),
    )

    expect(sent.teachingTeam).toEqual([{ member: 8, role: "Lecturer" }])
  })

  it("drops unsaved team changes when it reopens", async () => {
    const team = { editable: true, rows: [{ member: ada, role: "Tutor" }] }
    vi.mocked(updateOffering).mockResolvedValue({ formError: "stop", ok: false })
    render(<EditOfferingDialog courseId={1} initialValues={values} offeringId={10} team={team} />)

    fireEvent.click(screen.getByRole("button", { name: "Edit offering" }))
    fireEvent.click(await screen.findByRole("button", { name: "Remove Ada Lovelace" }))
    expect(screen.queryByRole("button", { name: "Remove Ada Lovelace" })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    fireEvent.click(screen.getByRole("button", { name: "Edit offering" }))
    expect(await screen.findByRole("button", { name: "Remove Ada Lovelace" })).toBeInTheDocument()
  })
})
