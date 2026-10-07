"use client"

import type { AddCapstoneCourseDialogValues } from "@repo/ui/components/composite"
import { useState } from "react"
import type { ActionResult } from "@/features/auth/actions/types"

type FieldErrors = Partial<Record<keyof AddCapstoneCourseDialogValues, string>>
export type CourseFormIntent = "draft" | "publish"

export interface UseCourseFormOptions {
  initialValues: AddCapstoneCourseDialogValues
  /** The server action behind both buttons. */
  save: (values: AddCapstoneCourseDialogValues, intent: CourseFormIntent) => Promise<ActionResult>
  /** Runs after a successful save, e.g. to toast and close the dialog. */
  onSaved: (values: AddCapstoneCourseDialogValues, intent: CourseFormIntent) => void
  /** Shown when `save` itself throws rather than returning an error. */
  failureMessage: string
}

/**
 * The form state and submit flow `AddCapstoneCourseDialog` needs, shared by
 * adding a course and reopening a draft. `dialogProps` spreads straight onto
 * the dialog; `reset` starts the form over, e.g. each time it opens.
 */
export function useCourseForm({
  initialValues,
  save,
  onSaved,
  failureMessage,
}: UseCourseFormOptions) {
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState<CourseFormIntent | undefined>(undefined)

  const reset = (nextValues: AddCapstoneCourseDialogValues) => {
    setValues(nextValues)
    setFieldErrors({})
    setFormError(undefined)
  }

  const submit = async (intent: CourseFormIntent) => {
    setSubmitting(intent)
    setFieldErrors({})
    setFormError(undefined)

    try {
      const result = await save(values, intent)

      if (result.ok) {
        onSaved(values, intent)
        return
      }

      setFieldErrors((result.fieldErrors as FieldErrors | undefined) ?? {})
      setFormError(result.formError)
    } catch {
      setFormError(failureMessage)
    } finally {
      setSubmitting(undefined)
    }
  }

  return {
    dialogProps: {
      fieldErrors,
      formError,
      onPublish: () => void submit("publish"),
      onSaveDraft: () => void submit("draft"),
      onValueChange: <Field extends keyof AddCapstoneCourseDialogValues>(
        field: Field,
        value: AddCapstoneCourseDialogValues[Field],
      ) => setValues((current) => ({ ...current, [field]: value })),
      submitting,
      values,
    },
    reset,
    setValues,
  }
}
