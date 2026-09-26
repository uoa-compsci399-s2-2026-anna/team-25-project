"use client"

import { CourseDeliveryFormat, CourseDeliveryFormatLabels } from "@repo/shared/enums/courses"
import {
  AddCapstoneCourseDialog,
  type AddCapstoneCourseDialogValues,
} from "@repo/ui/components/composite"
import { Button, toast } from "@repo/ui/components/ui"
import type { ComponentProps } from "react"
import { useState } from "react"
import { createCourse } from "../actions/createCourse"

const baseValues: AddCapstoneCourseDialogValues = {
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

const deliveryFormatOptions = Object.values(CourseDeliveryFormat).map((value) => ({
  label: CourseDeliveryFormatLabels[value],
  value,
}))

type FieldErrors = Partial<Record<keyof AddCapstoneCourseDialogValues, string>>
type Intent = "draft" | "publish"

export interface AddCourseDialogProps {
  /**
   * Pre-fills "Your role" from the signed-in member's profile position - still
   * editable. A promise rather than a value so the server can stream it in
   * without this dialog having to wait for it: the trigger is usable at once,
   * and the role lands in the field whenever it arrives.
   */
  defaultRole: Promise<string>
}

/**
 * The button that opens the dialog - also what stands in for it before it has
 * loaded. `DialogTrigger` clones its own click handling and a ref onto
 * whatever element is passed as its `trigger`, so every prop here has to
 * reach the real `<Button>` underneath rather than being swallowed by this
 * wrapper.
 */
export function AddCourseTriggerButton(props: ComponentProps<typeof Button>) {
  return (
    <Button size="xl" type="button" variant="button-mauve" {...props}>
      + Add your course
    </Button>
  )
}

export function AddCourseDialog({ defaultRole }: AddCourseDialogProps) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(baseValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState<Intent | undefined>(undefined)

  // Reopening always starts from a clean form - this dialog has no "continue
  // editing a draft" mode, only "start a new one".
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) return

    setValues(baseValues)
    setFieldErrors({})
    setFormError(undefined)
    // Seed "Your role" from the profile once that's known - but only into a
    // still-blank field, so a role the user has already typed while it was on
    // its way is never overwritten. A failed lookup just leaves it blank.
    void defaultRole.then(
      (role) => setValues((current) => (current.role ? current : { ...current, role })),
      () => undefined,
    )
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
      trigger={<AddCourseTriggerButton />}
      values={values}
    />
  )
}
