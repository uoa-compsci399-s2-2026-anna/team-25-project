"use client"

import type {
  AddCapstoneCourseDialogFieldErrors,
  AddCapstoneCourseDialogValues,
} from "@repo/ui/components/composite"
import { useState } from "react"
import type { ActionResult } from "@/features/auth/actions/types"

type FieldErrors = AddCapstoneCourseDialogFieldErrors
export type CourseFormIntent = "draft" | "publish"
type Submitting = CourseFormIntent | "delete"

export interface UseCourseFormOptions {
  initialValues: AddCapstoneCourseDialogValues
  /** The server action behind both buttons. */
  save: (values: AddCapstoneCourseDialogValues, intent: CourseFormIntent) => Promise<ActionResult>
  /** Runs after a successful save, e.g. to toast and close the dialog. */
  onSaved: (values: AddCapstoneCourseDialogValues, intent: CourseFormIntent) => void
  /** Shown when `save` itself throws rather than returning an error. */
  failureMessage: string
  /** Enables the dialog's "Delete draft" button. */
  remove?: {
    action: () => Promise<ActionResult>
    onRemoved: () => void
    failureMessage: string
  }
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
  remove,
}: UseCourseFormOptions) {
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState<Submitting | undefined>(undefined)

  const reset = (nextValues: AddCapstoneCourseDialogValues) => {
    setValues(nextValues)
    setFieldErrors({})
    setFormError(undefined)
  }

  const run = async (
    action: Submitting,
    request: () => Promise<ActionResult>,
    onDone: () => void,
    thrownMessage: string,
  ) => {
    setSubmitting(action)
    setFieldErrors({})
    setFormError(undefined)

    try {
      const result = await request()

      if (result.ok) {
        onDone()
        return
      }

      setFieldErrors((result.fieldErrors as FieldErrors | undefined) ?? {})
      setFormError(result.formError)
    } catch {
      setFormError(thrownMessage)
    } finally {
      setSubmitting(undefined)
    }
  }

  const submit = (intent: CourseFormIntent) =>
    run(
      intent,
      () => save(values, intent),
      () => onSaved(values, intent),
      failureMessage,
    )

  return {
    dialogProps: {
      fieldErrors,
      formError,
      onDelete:
        remove &&
        (() => void run("delete", remove.action, remove.onRemoved, remove.failureMessage)),
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
