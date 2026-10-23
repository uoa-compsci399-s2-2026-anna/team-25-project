import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"
import { Button } from "../../ui/Button/button"
import {
  AddCapstoneCourseDialog,
  type AddCapstoneCourseDialogValues,
} from "./add-capstone-course-dialog"

const deliveryFormatOptions = [
  { label: "In person", value: "inPerson" },
  { label: "Online", value: "online" },
  { label: "Hybrid", value: "hybrid" },
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

const meta: Meta<typeof AddCapstoneCourseDialog> = {
  title: "composite/AddCapstoneCourseDialog",
  component: AddCapstoneCourseDialog,
}

export default meta
type Story = StoryObj<typeof AddCapstoneCourseDialog>

export const Default: Story = {
  render: () => {
    const [values, setValues] = React.useState(emptyValues)
    const [submitting, setSubmitting] = React.useState<"draft" | "publish" | undefined>(undefined)

    const simulateSubmit = (intent: "draft" | "publish") => {
      setSubmitting(intent)
      setTimeout(() => setSubmitting(undefined), 1000)
    }

    return (
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        onPublish={() => simulateSubmit("publish")}
        onSaveDraft={() => simulateSubmit("draft")}
        onValueChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
        submitting={submitting}
        trigger={
          <Button size="xl" type="button" variant="button-mauve">
            + Add your course
          </Button>
        }
        values={values}
      />
    )
  },
}

// Reopening a saved draft, with a "Delete draft" button.
export const EditingDraft: Story = {
  render: () => {
    const [values, setValues] = React.useState({
      ...emptyValues,
      code: "CS399",
      name: "Capstone Project",
    })
    const [submitting, setSubmitting] = React.useState<"draft" | "publish" | "delete" | undefined>(
      undefined,
    )

    const simulateSubmit = (intent: "draft" | "publish" | "delete") => {
      setSubmitting(intent)
      setTimeout(() => setSubmitting(undefined), 1000)
    }

    return (
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        onDelete={() => simulateSubmit("delete")}
        onPublish={() => simulateSubmit("publish")}
        onSaveDraft={() => simulateSubmit("draft")}
        onValueChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
        submitting={submitting}
        title="Edit draft course"
        trigger={
          <Button size="xl" type="button" variant="button-mauve">
            Open draft
          </Button>
        }
        values={values}
      />
    )
  },
}

// Adding an offering to an existing course, pre-filled from its current one.
export const AddingOffering: Story = {
  render: () => {
    const [values, setValues] = React.useState({
      ...emptyValues,
      name: "Capstone Project",
      programme: "Bachelor of Science",
    })

    return (
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        kind="offering"
        onPublish={() => undefined}
        onValueChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
        trigger={
          <Button size="sm" type="button" variant="button-mauve">
            + Add offering
          </Button>
        }
        values={values}
      />
    )
  },
}

// Correcting a published offering, which goes live on save.
export const EditingOffering: Story = {
  render: () => {
    const [values, setValues] = React.useState({
      ...emptyValues,
      endDate: "2026-11-06",
      name: "Capstone Project",
      period: "Semester 2 2026",
      startDate: "2026-07-20",
    })

    return (
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        kind="correction"
        onPublish={() => undefined}
        onValueChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
        trigger={
          <Button size="sm" type="button" variant="button-transparent">
            Edit offering
          </Button>
        }
        values={values}
      />
    )
  },
}

export const WithErrors: Story = {
  render: () => {
    const [values, setValues] = React.useState(emptyValues)

    return (
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        fieldErrors={{
          code: "Course code is required",
          endDate: "The end date cannot precede the start date.",
          period: "Teaching period is required",
        }}
        formError="Could not save this course. Try again."
        onPublish={() => {}}
        onSaveDraft={() => {}}
        onValueChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
        open
        trigger={
          <Button size="xl" type="button" variant="button-mauve">
            + Add your course
          </Button>
        }
        values={values}
      />
    )
  },
}

export const MissingPublicationFields: Story = {
  render: () => {
    const [values, setValues] = React.useState({ ...emptyValues, code: "CS399" })

    return (
      <AddCapstoneCourseDialog
        deliveryFormatOptions={deliveryFormatOptions}
        fieldErrors={{
          assessments: "Assessments are required to publish",
          deliveryFormat: "Select a delivery format to publish",
          learningOutcomes: "Learning outcomes are required to publish",
          name: "Course name is required to publish",
          programme: "Course program is required to publish",
          projectType: "Project type is required to publish",
          role: "Your role is required to publish",
        }}
        onPublish={() => {}}
        onSaveDraft={() => {}}
        onValueChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
        open
        trigger={
          <Button size="xl" type="button" variant="button-mauve">
            + Add your course
          </Button>
        }
        values={values}
      />
    )
  },
}
