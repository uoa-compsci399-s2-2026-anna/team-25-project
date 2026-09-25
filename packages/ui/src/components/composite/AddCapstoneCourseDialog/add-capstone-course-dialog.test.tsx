import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Button } from "../../ui/Button/button"
import {
  AddCapstoneCourseDialog,
  type AddCapstoneCourseDialogProps,
  type AddCapstoneCourseDialogValues,
} from "./add-capstone-course-dialog"

const deliveryFormatOptions = [
  { label: "In person", value: "inPerson" },
  { label: "Online", value: "online" },
]

const emptyValues: AddCapstoneCourseDialogValues = {
  assessments: null,
  code: "",
  deliveryFormat: "",
  endDate: "",
  learningOutcomes: null,
  name: "",
  period: "",
  programme: "",
  projectType: "",
  role: "",
  startDate: "",
}

function renderDialog(overrides?: {
  values?: AddCapstoneCourseDialogValues
  fieldErrors?: Partial<Record<keyof AddCapstoneCourseDialogValues, string>>
  formError?: string
  submitting?: "draft" | "publish"
  onSaveDraft?: () => void
  onPublish?: () => void
  onValueChange?: AddCapstoneCourseDialogProps["onValueChange"]
}) {
  return render(
    <AddCapstoneCourseDialog
      deliveryFormatOptions={deliveryFormatOptions}
      fieldErrors={overrides?.fieldErrors}
      formError={overrides?.formError}
      onPublish={overrides?.onPublish ?? vi.fn()}
      onSaveDraft={overrides?.onSaveDraft ?? vi.fn()}
      onValueChange={overrides?.onValueChange ?? vi.fn()}
      open
      submitting={overrides?.submitting}
      trigger={
        <Button size="xl" type="button" variant="button-mauve">
          + Add your course
        </Button>
      }
      values={overrides?.values ?? emptyValues}
    />,
  )
}

describe("AddCapstoneCourseDialog", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the dialog title and every field from the values object", () => {
    renderDialog()

    const dialog = screen.getByRole("dialog", { name: "Add a capstone course" })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAccessibleDescription(
      "Course code and name are all a draft needs - everything else here is for when you publish.",
    )
    expect(screen.getByLabelText("Course code")).toBeInTheDocument()
    expect(screen.getByLabelText("Teaching period")).toBeInTheDocument()
    expect(screen.getByLabelText("Start date")).toBeInTheDocument()
    expect(screen.getByLabelText("End date")).toBeInTheDocument()
    expect(screen.getByLabelText("Course name")).toBeInTheDocument()
    expect(screen.getByLabelText("Course program")).toBeInTheDocument()
    expect(screen.getByLabelText("Project type")).toBeInTheDocument()
    expect(screen.getByLabelText("Your role")).toBeInTheDocument()
    expect(screen.getByLabelText("Learning outcomes")).toBeInTheDocument()
    expect(screen.getByLabelText("Assessments")).toBeInTheDocument()
  })

  it("groups fields into separate blocks rather than one flat list", () => {
    renderDialog()

    // No visible section labels - the grouping is conveyed by gaps between
    // separate field-group blocks, so there should be more than one per
    // column. Dialog content renders into a portal, so query the document
    // rather than the render container.
    expect(document.querySelectorAll('[data-slot="field-group"]').length).toBeGreaterThan(2)
  })

  it("reports a field change through onValueChange rather than mutating internally", () => {
    const onValueChange = vi.fn()
    renderDialog({ onValueChange })

    fireEvent.change(screen.getByLabelText("Course code"), { target: { value: "CS399" } })

    expect(onValueChange).toHaveBeenCalledWith("code", "CS399")
  })

  it("calls onSaveDraft when Save draft is clicked", () => {
    const onSaveDraft = vi.fn()
    renderDialog({ onSaveDraft })

    fireEvent.click(screen.getByRole("button", { name: "Save draft" }))

    expect(onSaveDraft).toHaveBeenCalledTimes(1)
  })

  it("calls onPublish when Publish is clicked", () => {
    const onPublish = vi.fn()
    renderDialog({ onPublish })

    fireEvent.click(screen.getByRole("button", { name: "Publish" }))

    expect(onPublish).toHaveBeenCalledTimes(1)
  })

  it("disables both actions while either is submitting, labelling the active one", () => {
    renderDialog({ submitting: "publish" })

    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Publishing..." })).toBeDisabled()
  })

  it("shows a field error against the field it names", () => {
    renderDialog({ fieldErrors: { role: "Your role is required to publish" } })

    expect(screen.getByText("Your role is required to publish")).toBeInTheDocument()
  })

  it("marks only the input as invalid, not the field wrapper that colors the title, on a field error", () => {
    renderDialog({ fieldErrors: { code: "Course code is required" } })

    const input = screen.getByLabelText("Course code")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input.closest('[data-slot="field"]')).not.toHaveAttribute("data-invalid", "true")
  })

  it("shows a form-level error", () => {
    renderDialog({ formError: "Could not save this course. Try again." })

    expect(screen.getByRole("alert")).toHaveTextContent("Could not save this course. Try again.")
  })
})
