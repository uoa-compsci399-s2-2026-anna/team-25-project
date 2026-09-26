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
