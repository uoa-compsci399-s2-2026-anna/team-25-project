"use client"

import { CourseDeliveryFormat, CourseDeliveryFormatLabels } from "@repo/shared/enums/courses"
import {
  AddCapstoneCourseDialog,
  type AddCapstoneCourseDialogValues,
} from "@repo/ui/components/composite"
import { Button, toast } from "@repo/ui/components/ui"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createCourse } from "../actions/createCourse"

const baseValues: AddCapstoneCourseDialogValues = {
  assessments: "",
  code: "",
  deliveryFormat: "",
  endDate: "",
  learningOutcomes: "",
  name: "",
  period: "",
  programme: "",
  projectType: "",
  role: "",
  startDate: "",
}

const deliveryFormatOptions = Object.values(CourseDeliveryFormat).map((value) => ({
  label: CourseDeliveryFormatLabels[value],
  value,
}))

type FieldErrors = Partial<Record<keyof AddCapstoneCourseDialogValues, string>>
type Intent = "draft" | "publish"

export interface AddCourseDialogProps {
  /** Pre-fills "Your role" from the signed-in member's profile position - still editable. */
  defaultRole: string
}

export function AddCourseDialog({ defaultRole }: AddCourseDialogProps) {
  const router = useRouter()
  const emptyValues: AddCapstoneCourseDialogValues = { ...baseValues, role: defaultRole }
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(emptyValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState<Intent | undefined>(undefined)

  // Reopening always starts from a clean form - this dialog has no "continue
  // editing a draft" mode, only "start a new one".
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setValues(emptyValues)
      setFieldErrors({})
      setFormError(undefined)
    }
  }

  const submit = async (intent: Intent) => {
    setSubmitting(intent)
    setFieldErrors({})
    setFormError(undefined)

    try {
      const result = await createCourse({ ...values, intent })

      if (result.ok) {
        toast.add({
          description:
            intent === "publish"
              ? `${values.code} is now published.`
              : `${values.code} was saved as a draft.`,
          title: "Course added",
        })
        setOpen(false)
        // The courses table and "Your Entries" panel are server-rendered and
        // read the tag the create action just revalidated - refresh to pull
        // that in rather than patching client state by hand.
        router.refresh()
        return
      }

      setFieldErrors((result.fieldErrors as FieldErrors | undefined) ?? {})
      setFormError(result.formError)
    } catch {
      setFormError("Could not add this course. Try again.")
    } finally {
      setSubmitting(undefined)
    }
  }

  return (
    <AddCapstoneCourseDialog
      deliveryFormatOptions={deliveryFormatOptions}
      fieldErrors={fieldErrors}
      formError={formError}
      onOpenChange={handleOpenChange}
      onPublish={() => void submit("publish")}
      onSaveDraft={() => void submit("draft")}
      onValueChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
      open={open}
      submitting={submitting}
      trigger={
        <Button size="xl" type="button" variant="button-mauve">
          + Add your course
        </Button>
      }
      values={values}
    />
  )
}
