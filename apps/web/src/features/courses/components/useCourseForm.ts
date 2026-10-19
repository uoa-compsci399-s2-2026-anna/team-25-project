"use client"

import type {
  AddCapstoneCourseDialogValues,
  CourseOfferingDialogValues,
} from "@repo/ui/components/composite"
import { useState } from "react"
import type { ActionResult } from "@/features/auth/actions/types"

type FieldErrors<Values> = Partial<Record<keyof Values, string>>
export type CourseFormIntent = "draft" | "publish"
type Submitting = CourseFormIntent | "delete"

export interface UseCourseFormOptions<Values> {
  initialValues: Values
  /** The server action behind both buttons. */
  save: (values: Values, intent: CourseFormIntent) => Promise<ActionResult>
  /** Runs after a successful save, e.g. to toast and close the dialog. */
  onSaved: (values: Values, intent: CourseFormIntent) => void
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
 * The form state and submit flow the course dialogs need, shared by adding a
 * course, reopening a draft, and adding or editing an offering. `dialogProps`
 * spreads straight onto `AddCapstoneCourseDialog` or `CourseOfferingDialog`;
 * `reset` starts the form over, e.g. each time it opens.
 */
export function useCourseForm<
  Values extends AddCapstoneCourseDialogValues | CourseOfferingDialogValues,
>({ initialValues, save, onSaved, failureMessage, remove }: UseCourseFormOptions<Values>) {
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Values>>({})
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState<Submitting | undefined>(undefined)

  const reset = (nextValues: Values) => {
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

      setFieldErrors((result.fieldErrors as FieldErrors<Values> | undefined) ?? {})
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
      onValueChange: <Field extends keyof Values>(field: Field, value: Values[Field]) =>
        setValues((current) => ({ ...current, [field]: value })),
      submitting,
      values,
    },
    reset,
    setValues,
  }
}
