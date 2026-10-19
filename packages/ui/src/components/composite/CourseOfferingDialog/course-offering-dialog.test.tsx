import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  CourseOfferingDialog,
  type CourseOfferingDialogProps,
  type CourseOfferingDialogValues,
} from "./course-offering-dialog"

const values: CourseOfferingDialogValues = {
  additionalInfo: null,
  assessments: null,
  changeSummary: "",
  deliveryFormat: "",
  endDate: "",
  learningOutcomes: null,
  name: "Capstone Project",
  programme: "",
  projectType: "",
  role: "",
  startDate: "",
  term: "",
  year: "",
}

const renderDialog = (props: Partial<CourseOfferingDialogProps> = {}) =>
  render(
    <CourseOfferingDialog
      deliveryFormatOptions={[{ label: "In person", value: "inPerson" }]}
      mode="add"
      onPublish={vi.fn()}
      onSaveDraft={vi.fn()}
      onValueChange={vi.fn()}
      open
      termOptions={[{ label: "Semester 1", value: "semester1" }]}
      values={values}
      {...props}
    />,
  )

afterEach(() => {
  cleanup()
})

describe("CourseOfferingDialog", () => {
  it("has no course code field, since the code belongs to the course", () => {
    renderDialog()
    expect(screen.queryByLabelText(/Course code/)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Course name/)).toHaveValue("Capstone Project")
  })

  it("titles itself after its mode unless given a title", () => {
    renderDialog({ mode: "editDraft" })
    expect(screen.getByRole("dialog", { name: "Edit draft offering" })).toBeInTheDocument()
    cleanup()
    renderDialog({ mode: "correct", title: "Edit Semester 1 2027" })
    expect(screen.getByRole("dialog", { name: "Edit Semester 1 2027" })).toBeInTheDocument()
  })

  describe("adding", () => {
    it("asks where to start from and reports a change", async () => {
      const user = userEvent.setup()
      const onStartChange = vi.fn()
      renderDialog({
        startFrom: {
          onValueChange: onStartChange,
          options: [
            { label: "Semester 1 2027 (newest)", value: "4" },
            { label: "Blank", value: "blank" },
          ],
          value: "4",
        },
      })

      const startFrom = screen.getByRole("combobox", { name: "Start from" })
      expect(startFrom).toHaveTextContent("Semester 1 2027 (newest)")
      await user.click(startFrom)
      await user.click(await screen.findByRole("option", { name: "Blank" }))

      expect(onStartChange).toHaveBeenCalledWith("blank")
    })

    it("can save a draft or publish, but not delete", () => {
      renderDialog({ onDelete: vi.fn() })
      expect(screen.getByRole("button", { name: "Save draft" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Delete draft" })).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/What changed/)).not.toBeInTheDocument()
    })
  })

  it("lets a draft be deleted once confirmed", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderDialog({ mode: "editDraft", onDelete })

    await user.click(screen.getByRole("button", { name: "Delete draft" }))
    expect(onDelete).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Confirm delete" }))

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  describe("correcting", () => {
    it("asks what changed, and only publishes", () => {
      renderDialog({ mode: "correct", onDelete: vi.fn() })

      expect(screen.getByLabelText(/What changed/)).toBeRequired()
      expect(screen.getByRole("button", { name: "Publish correction" })).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Delete draft" })).not.toBeInTheDocument()
    })

    it("reports the change summary as it's typed", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      renderDialog({ mode: "correct", onValueChange })

      await user.type(screen.getByLabelText(/What changed/), "x")

      expect(onValueChange).toHaveBeenCalledWith("changeSummary", "x")
    })

    it("shows the change summary's error", () => {
      renderDialog({
        fieldErrors: { changeSummary: "Say what changed to publish a correction" },
        mode: "correct",
      })
      expect(screen.getByText("Say what changed to publish a correction")).toBeInTheDocument()
      expect(screen.getByLabelText(/What changed/)).toHaveAttribute("aria-invalid", "true")
    })
  })

  it("hides Your role once the offering has a teaching team", () => {
    renderDialog({ showRole: false })
    expect(screen.queryByLabelText(/Your role/)).not.toBeInTheDocument()
  })
})
