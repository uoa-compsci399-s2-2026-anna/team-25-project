import { Button } from "@repo/ui/components/ui"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  AddCapstoneCourseDialog,
  type AddCapstoneCourseDialogProps,
  type AddCapstoneCourseDialogValues,
} from "./AddCapstoneCourseDialog"

const deliveryFormatOptions = [
  { label: "In person", value: "inPerson" },
  { label: "Online", value: "online" },
]

const emptyValues: AddCapstoneCourseDialogValues = {
  additionalInfo: null,
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
      "Course code and name are all a draft needs - fields marked with an asterisk are required to publish.",
    )
    // Matched loosely because a required label carries a trailing asterisk.
    for (const label of [
      "Course code",
      "Teaching period",
      "Start date",
      "End date",
      "Course name",
      "Course program",
      "Project type",
      "Your role",
      "Learning outcomes",
      "Assessments",
      "Additional information",
    ]) {
      expect(screen.getByLabelText(new RegExp(`^${label}`))).toBeInTheDocument()
    }
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

    fireEvent.change(screen.getByLabelText(/^Course code/), { target: { value: "CS399" } })

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

    const input = screen.getByLabelText(/^Course code/)
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input.closest('[data-slot="field"]')).not.toHaveAttribute("data-invalid", "true")
  })

  // Screen readers get aria-required, sighted users get the asterisk. Both must
  // reach every field publishing needs, including the rich text editors.
  it("marks every field publishing needs as required, and leaves additional information unmarked", () => {
    renderDialog()

    for (const label of [
      "Course name",
      "Course code",
      "Course program",
      "Teaching period",
      "Start date",
      "End date",
      "Project type",
      "Your role",
      "Learning outcomes",
      "Assessments",
    ]) {
      expect(screen.getByLabelText(new RegExp(`^${label}`))).toHaveAttribute(
        "aria-required",
        "true",
      )
    }
    expect(screen.getByLabelText(/^Delivery format/)).toHaveAttribute("aria-required", "true")
    expect(screen.getByLabelText(/^Additional information/)).not.toHaveAttribute("aria-required")

    expect(screen.getAllByText("*")).toHaveLength(11)
  })

  it("shows a form-level error", () => {
    renderDialog({ formError: "Could not save this course. Try again." })

    expect(screen.getByRole("alert")).toHaveTextContent("Could not save this course. Try again.")
  })
  it("takes a custom title and opens without a trigger when driven through open", () => {
    render(
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        onPublish={vi.fn()}
        onSaveDraft={vi.fn()}
        onValueChange={vi.fn()}
        open
        title="Edit draft course"
        values={emptyValues}
      />,
    )

    expect(screen.getByRole("dialog", { name: "Edit draft course" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "+ Add your course" })).not.toBeInTheDocument()
  })
  it("stops the end date picker before the start date", () => {
    renderDialog({ values: { ...emptyValues, startDate: "2026-07-20" } })

    expect(screen.getByLabelText(/End date/)).toHaveAttribute("min", "2026-07-20")
  })
  it("drops the course code and role when adding an offering", () => {
    render(
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        kind="offering"
        onPublish={vi.fn()}
        onValueChange={vi.fn()}
        open
        values={emptyValues}
      />,
    )

    expect(screen.getByRole("dialog", { name: "Add an offering" })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Course code/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Your role/)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument()
  })
  it("titles a correction and saves it rather than publishing", () => {
    render(
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        kind="correction"
        onPublish={vi.fn()}
        onValueChange={vi.fn()}
        open
        values={emptyValues}
      />,
    )

    expect(screen.getByRole("dialog", { name: "Edit offering" })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Course code/)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument()
  })
  it("titles a draft offering, without the course code or role", () => {
    render(
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        kind="draft"
        onDelete={vi.fn()}
        onPublish={vi.fn()}
        onSaveDraft={vi.fn()}
        onValueChange={vi.fn()}
        open
        values={emptyValues}
      />,
    )

    expect(screen.getByRole("dialog", { name: "Edit draft offering" })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Course code/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Your role/)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save draft" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete draft" })).toBeInTheDocument()
  })
  describe("deleting a draft", () => {
    const renderDraft = (overrides: Partial<AddCapstoneCourseDialogProps> = {}) =>
      render(
        <AddCapstoneCourseDialog
          deliveryFormatOptions={deliveryFormatOptions}
          onDelete={vi.fn()}
          onPublish={vi.fn()}
          onSaveDraft={vi.fn()}
          onValueChange={vi.fn()}
          open
          values={emptyValues}
          {...overrides}
        />,
      )

    it("offers no delete button without onDelete, as when adding a course", () => {
      renderDialog()
      expect(screen.queryByRole("button", { name: "Delete draft" })).not.toBeInTheDocument()
    })

    it("asks for confirmation before deleting", () => {
      const onDelete = vi.fn()
      renderDraft({ onDelete })

      fireEvent.click(screen.getByRole("button", { name: "Delete draft" }))

      expect(onDelete).not.toHaveBeenCalled()
      expect(screen.getByText("Delete this draft? This can't be undone.")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }))
      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it("goes back to the normal footer when the confirmation is cancelled", () => {
      const onDelete = vi.fn()
      renderDraft({ onDelete })

      fireEvent.click(screen.getByRole("button", { name: "Delete draft" }))
      fireEvent.click(screen.getByRole("button", { name: "Keep draft" }))

      expect(onDelete).not.toHaveBeenCalled()
      expect(screen.getByRole("button", { name: "Delete draft" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument()
    })

    it("disables every action while deleting, labelling the delete", () => {
      renderDraft({ submitting: "delete" })

      expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled()
    })
  })
})

describe("AddCapstoneCourseDialog teaching team", () => {
  afterEach(() => {
    cleanup()
  })

  const ada = { id: 1, firstName: "Ada", lastName: "Lovelace" }
  const alan = { id: 2, firstName: "Alan", lastName: "Turing" }
  const rows = [
    { member: ada, role: "Lecturer" },
    { member: alan, role: "Tutor" },
  ]

  const renderTeam = (teachingTeam: AddCapstoneCourseDialogProps["teachingTeam"]) =>
    render(
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        kind="correction"
        onPublish={vi.fn()}
        onValueChange={vi.fn()}
        open
        teachingTeam={teachingTeam}
        values={emptyValues}
      />,
    )

  it("lets a course editor change a role and remove a member", () => {
    const onChange = vi.fn()
    renderTeam({ onChange, onSearch: vi.fn(), rows })

    fireEvent.change(screen.getByLabelText("Role of Alan Turing"), {
      target: { value: "Head tutor" },
    })
    expect(onChange).toHaveBeenLastCalledWith([rows[0], { member: alan, role: "Head tutor" }])

    fireEvent.click(screen.getByRole("button", { name: "Remove Ada Lovelace" }))
    expect(onChange).toHaveBeenLastCalledWith([rows[1]])
  })

  it("marks a blank role when the team has an error", () => {
    render(
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        fieldErrors={{ teachingTeam: "Give each teaching team member a role to publish." }}
        kind="correction"
        onPublish={vi.fn()}
        onValueChange={vi.fn()}
        open
        teachingTeam={{
          onChange: vi.fn(),
          onSearch: vi.fn(),
          rows: [rows[0], { member: alan, role: " " }],
        }}
        values={emptyValues}
      />,
    )

    expect(
      screen.getByText("Give each teaching team member a role to publish."),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Role of Alan Turing")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByLabelText("Role of Ada Lovelace")).not.toHaveAttribute("aria-invalid")
  })

  // Teaching staff see the team read-only, so they cannot fill the role in themselves.
  it("asks a read-only viewer to have an editor add a missing role", () => {
    render(
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        fieldErrors={{ teachingTeam: "Give each teaching team member a role to publish." }}
        kind="correction"
        onPublish={vi.fn()}
        onValueChange={vi.fn()}
        open
        teachingTeam={{ onSearch: vi.fn(), rows: [rows[0], { member: alan, role: "" }] }}
        values={emptyValues}
      />,
    )

    expect(
      screen.getByText(/Ask the course's owner or an editor to add the missing roles\./),
    ).toBeInTheDocument()
    expect(screen.getByRole("list", { name: "Teaching team" })).toHaveTextContent(
      "Alan TuringNo role",
    )
  })

  it("shows the team read-only without onChange", () => {
    renderTeam({ onSearch: vi.fn(), rows })

    const team = screen.getByRole("list", { name: "Teaching team" })
    expect(team).toHaveTextContent("Ada Lovelace")
    expect(team).toHaveTextContent("Tutor")
    expect(screen.queryByLabelText("Add a teaching team member")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Remove/ })).not.toBeInTheDocument()
    expect(
      screen.getByText("Only the course's owner and editors can change the teaching team."),
    ).toBeInTheDocument()
  })

  it("is not shown on a new course, which asks for the creator's role instead", () => {
    render(
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        onPublish={vi.fn()}
        onValueChange={vi.fn()}
        open
        teachingTeam={{ onSearch: vi.fn(), rows }}
        values={emptyValues}
      />,
    )

    expect(screen.queryByRole("list", { name: "Teaching team" })).not.toBeInTheDocument()
  })
})
