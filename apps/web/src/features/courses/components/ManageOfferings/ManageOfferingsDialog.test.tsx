import { toast } from "@repo/ui/components/ui"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createOffering } from "../../actions/createOffering"
import { deleteOffering } from "../../actions/deleteOffering"
import { updateOffering } from "../../actions/updateOffering"
import {
  blankOfferingValues,
  type ManageableOffering,
  type ManageableOfferings,
} from "../../courses.format"
import { ManageOfferingsDialog } from "./ManageOfferingsDialog"

vi.mock("../../actions/createOffering", () => ({ createOffering: vi.fn() }))
vi.mock("../../actions/updateOffering", () => ({ updateOffering: vi.fn() }))
vi.mock("../../actions/deleteOffering", () => ({ deleteOffering: vi.fn() }))

const offering = (overrides: Partial<ManageableOffering>): ManageableOffering => ({
  detail: "",
  hasTeachingTeam: true,
  id: 1,
  period: "Semester 1 2027",
  status: "published",
  values: {
    ...blankOfferingValues("Senior Lecturer"),
    name: "Capstone Project",
    programme: "BSc",
    term: "semester1",
    year: "2027",
    startDate: "2027-03-01",
    endDate: "2027-06-25",
  },
  ...overrides,
})

const data: ManageableOfferings = {
  courseCode: "COMPSCI 399",
  courseId: 7,
  offerings: [
    offering({ id: 5, period: "Semester 2 2027", status: "draft", hasTeachingTeam: false }),
    offering({ id: 4 }),
  ],
  role: "Senior Lecturer",
}

const toastSpy = vi.spyOn(toast, "add")

const toasted = (description: string) =>
  waitFor(() => {
    expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ description }))
  })

const openManager = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<ManageOfferingsDialog data={data} />)
  await user.click(screen.getByRole("button", { name: "Manage offerings" }))
}

describe("ManageOfferingsDialog", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    act(() => {
      toast.close()
    })
  })

  it("lists every offering, drafts included", async () => {
    const user = userEvent.setup()
    await openManager(user)

    expect(screen.getByRole("dialog", { name: "Manage offerings" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit Semester 2 2027" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit Semester 1 2027" })).toBeInTheDocument()
  })

  describe("adding", () => {
    it("starts from the newest published offering, with an empty period and dates", async () => {
      const user = userEvent.setup()
      await openManager(user)
      await user.click(screen.getByRole("button", { name: "Add offering" }))

      expect(screen.getByRole("dialog", { name: "Add an offering" })).toBeInTheDocument()
      expect(screen.getByRole("combobox", { name: "Start from" })).toHaveTextContent(
        "Semester 1 2027 (newest published)",
      )
      expect(screen.getByLabelText(/^Course name/)).toHaveValue("Capstone Project")
      expect(screen.getByLabelText(/^Year/)).toHaveValue("")
      expect(screen.getByLabelText(/^Start date/)).toHaveValue("")
    })

    it("clears the copied content when starting blank", async () => {
      const user = userEvent.setup()
      await openManager(user)
      await user.click(screen.getByRole("button", { name: "Add offering" }))

      await user.click(screen.getByRole("combobox", { name: "Start from" }))
      await user.click(await screen.findByRole("option", { name: "Blank" }))

      expect(screen.getByLabelText(/^Course name/)).toHaveValue("")
      // A blank start has no teaching team to keep, so publishing makes it the member's.
      expect(screen.getByLabelText(/^Your role/)).toHaveValue("Senior Lecturer")
    })

    it("starts from the newest offering when none is published yet", async () => {
      const user = userEvent.setup()
      render(<ManageOfferingsDialog data={{ ...data, offerings: [data.offerings[0]] }} />)
      await user.click(screen.getByRole("button", { name: "Manage offerings" }))
      await user.click(screen.getByRole("button", { name: "Add offering" }))

      expect(screen.getByRole("combobox", { name: "Start from" })).toHaveTextContent(
        "Semester 2 2027 (draft) (newest)",
      )
    })

    it("asks for Your role only when the Start from offering has no teaching team", async () => {
      const user = userEvent.setup()
      await openManager(user)
      await user.click(screen.getByRole("button", { name: "Add offering" }))

      expect(screen.queryByLabelText(/^Your role/)).not.toBeInTheDocument()

      await user.click(screen.getByRole("combobox", { name: "Start from" }))
      await user.click(await screen.findByRole("option", { name: "Semester 2 2027 (draft)" }))

      expect(screen.getByLabelText(/^Your role/)).toBeInTheDocument()
    })

    // The source's team can change in another tab after the list was loaded.
    it("shows Your role with its error when the action asks for one", async () => {
      const user = userEvent.setup()
      vi.mocked(createOffering).mockResolvedValue({
        fieldErrors: { role: "Your role is required to publish" },
        ok: false,
      })
      await openManager(user)
      await user.click(screen.getByRole("button", { name: "Add offering" }))
      expect(screen.queryByLabelText(/^Your role/)).not.toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Publish" }))

      expect(await screen.findByLabelText(/^Your role/)).toBeInTheDocument()
      expect(screen.getByText("Your role is required to publish")).toBeInTheDocument()
    })

    it("saves against the course and its Start from offering, then returns to the list", async () => {
      const user = userEvent.setup()
      vi.mocked(createOffering).mockResolvedValue({ ok: true })
      await openManager(user)
      await user.click(screen.getByRole("button", { name: "Add offering" }))

      await user.click(screen.getByRole("button", { name: "Save draft" }))

      expect(createOffering).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: 7,
          intent: "draft",
          name: "Capstone Project",
          startFromId: 4,
        }),
      )
      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: "Manage offerings" })).toBeInTheDocument()
      })
      await toasted("The offering was saved as a draft.")
    })
  })

  it("edits a draft, and can delete it", async () => {
    const user = userEvent.setup()
    vi.mocked(deleteOffering).mockResolvedValue({ ok: true })
    await openManager(user)
    await user.click(screen.getByRole("button", { name: "Edit Semester 2 2027" }))

    expect(screen.getByRole("dialog", { name: "Edit draft offering" })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Your role/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Delete draft" }))
    await user.click(screen.getByRole("button", { name: "Confirm delete" }))

    expect(deleteOffering).toHaveBeenCalledWith({ courseId: 7, offeringId: 5 })
    await toasted("Semester 2 2027 was deleted.")
  })

  it("corrects a published offering with a summary of what changed", async () => {
    const user = userEvent.setup()
    vi.mocked(updateOffering).mockResolvedValue({ ok: true })
    await openManager(user)
    await user.click(screen.getByRole("button", { name: "Edit Semester 1 2027" }))

    expect(screen.getByRole("dialog", { name: "Edit Semester 1 2027" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument()
    await user.type(screen.getByLabelText(/What changed/), "Fixed the dates")
    await user.click(screen.getByRole("button", { name: "Publish correction" }))

    expect(updateOffering).toHaveBeenCalledWith(
      expect.objectContaining({
        changeSummary: "Fixed the dates",
        courseId: 7,
        intent: "publish",
        offeringId: 4,
      }),
    )
    await toasted("Semester 1 2027 was corrected.")
  })

  it("keeps the dialog open with the action's error", async () => {
    const user = userEvent.setup()
    vi.mocked(updateOffering).mockResolvedValue({
      formError: "The correction has no content changes.",
      ok: false,
    })
    await openManager(user)
    await user.click(screen.getByRole("button", { name: "Edit Semester 1 2027" }))
    await user.click(screen.getByRole("button", { name: "Publish correction" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The correction has no content changes.",
    )
    expect(screen.getByRole("dialog", { name: "Edit Semester 1 2027" })).toBeInTheDocument()
  })
})
