import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"
import { Button } from "../../ui/Button/button"
import type { CourseFormSubmitting } from "../CourseForm/course-form"
import type { RichTextValue } from "../RichTextEditor/rich-text-editor"
import {
  CourseOfferingDialog,
  type CourseOfferingDialogProps,
  type CourseOfferingDialogValues,
} from "./course-offering-dialog"

const deliveryFormatOptions = [
  { label: "In person", value: "inPerson" },
  { label: "Online", value: "online" },
  { label: "Hybrid", value: "hybrid" },
]

const termOptions = [
  { label: "Summer School", value: "summerSchool" },
  { label: "Semester 1", value: "semester1" },
  { label: "Semester 2", value: "semester2" },
  { label: "Full Year", value: "fullYear" },
]

const paragraph = (text: string) =>
  ({
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", text, version: 1 }],
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    },
  }) as unknown as RichTextValue

const blank: CourseOfferingDialogValues = {
  additionalInfo: null,
  assessments: null,
  changeSummary: "",
  deliveryFormat: "",
  endDate: "",
  learningOutcomes: null,
  name: "",
  programme: "",
  projectType: "",
  role: "",
  startDate: "",
  term: "",
  year: "",
}

// What "Start from" copies from Semester 1 2027: everything but the period, dates
// and change summary.
const copied: CourseOfferingDialogValues = {
  ...blank,
  assessments: paragraph("Group project (60%), individual report (40%)."),
  deliveryFormat: "inPerson",
  learningOutcomes: paragraph("Plan and deliver a software project in a team."),
  name: "Capstone Project",
  programme: "Bachelor of Science",
  projectType: "Industry",
}

const published: CourseOfferingDialogValues = {
  ...copied,
  endDate: "2027-06-25",
  startDate: "2027-03-01",
  term: "semester1",
  year: "2027",
}

/** Holds the form state a story's dialog edits, and fakes a one-second save. */
function Harness({
  initialValues,
  ...props
}: Omit<CourseOfferingDialogProps, "values" | "onValueChange" | "onSaveDraft" | "onPublish"> & {
  initialValues: CourseOfferingDialogValues
}) {
  const [values, setValues] = React.useState(initialValues)
  const [submitting, setSubmitting] = React.useState<CourseFormSubmitting | undefined>(undefined)

  const simulate = (action: CourseFormSubmitting) => {
    setSubmitting(action)
    setTimeout(() => setSubmitting(undefined), 1000)
  }

  return (
    <CourseOfferingDialog
      {...props}
      onDelete={props.onDelete && (() => simulate("delete"))}
      onPublish={() => simulate("publish")}
      onSaveDraft={() => simulate("draft")}
      onValueChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
      submitting={submitting}
      trigger={
        <Button size="xl" type="button" variant="button-mauve">
          Open
        </Button>
      }
      values={values}
    />
  )
}

const meta: Meta<typeof CourseOfferingDialog> = {
  title: "composite/CourseOfferingDialog",
  component: CourseOfferingDialog,
}

export default meta
type Story = StoryObj<typeof CourseOfferingDialog>

// Switching "Start from" swaps the values and reloads the fields.
export const Add: Story = {
  render: () => {
    const [start, setStart] = React.useState("4")
    return (
      <Harness
        deliveryFormatOptions={deliveryFormatOptions}
        initialValues={start === "blank" ? blank : copied}
        key={start}
        mode="add"
        showRole={false}
        startFrom={{
          onValueChange: setStart,
          options: [
            { label: "Semester 1 2027 (newest)", value: "4" },
            { label: "Blank", value: "blank" },
          ],
          value: start,
        }}
        termOptions={termOptions}
      />
    )
  },
}

export const EditDraft: Story = {
  render: () => (
    <Harness
      deliveryFormatOptions={deliveryFormatOptions}
      initialValues={{ ...copied, term: "semester2", year: "2027" }}
      mode="editDraft"
      onDelete={() => {}}
      showRole={false}
      termOptions={termOptions}
    />
  ),
}

export const CorrectPublished: Story = {
  render: () => (
    <Harness
      deliveryFormatOptions={deliveryFormatOptions}
      initialValues={published}
      mode="correct"
      showRole={false}
      termOptions={termOptions}
      title="Correct Semester 1 2027"
    />
  ),
}

export const CorrectionWithErrors: Story = {
  render: () => (
    <Harness
      deliveryFormatOptions={deliveryFormatOptions}
      fieldErrors={{ changeSummary: "Say what changed to publish a correction" }}
      formError="The correction has no content changes."
      initialValues={published}
      mode="correct"
      open
      showRole={false}
      termOptions={termOptions}
    />
  ),
}
