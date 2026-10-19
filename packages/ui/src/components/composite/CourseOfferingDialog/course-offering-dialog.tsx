"use client"

import { Field, FieldError, FieldGroup, FieldLabel, TextArea } from "@repo/ui/components/ui"
import * as React from "react"
import {
  CourseFormDialog,
  CourseFormFooter,
  type CourseFormOption,
  CourseFormSelectField,
  type CourseFormSubmitting,
  CourseOfferingFields,
  type CourseOfferingFieldValues,
  RequiredAsterisk,
} from "../CourseForm/course-form"

export type CourseOfferingDialogValues = CourseOfferingFieldValues & {
  /** Why a published offering changed. Only shown, and only sent, when correcting one. */
  changeSummary: string
}

export type CourseOfferingDialogFieldErrors = Partial<
  Record<keyof CourseOfferingDialogValues, string>
>

/**
 * - `add`: a new offering, optionally started from one the course already has.
 * - `editDraft`: an unpublished offering, saved or published as-is, or deleted.
 * - `correct`: a published offering. Changes go live on save, with a "What changed?".
 */
export type CourseOfferingDialogMode = "add" | "editDraft" | "correct"

export type CourseOfferingDialogProps = {
  mode: CourseOfferingDialogMode
  /** Defaults to one that names the mode. */
  title?: string
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  values: CourseOfferingDialogValues
  onValueChange: <Field extends keyof CourseOfferingDialogValues>(
    field: Field,
    value: CourseOfferingDialogValues[Field],
  ) => void
  fieldErrors?: CourseOfferingDialogFieldErrors
  formError?: string
  deliveryFormatOptions: CourseFormOption[]
  termOptions: CourseFormOption[]
  /**
   * The offerings an added one can copy its content from, plus a blank start. Only
   * shown in `add` mode; changing it reloads the fields, so the caller swaps `values`.
   */
  startFrom?: {
    options: CourseFormOption[]
    value: string
    onValueChange: (value: string) => void
  }
  /** See `CourseOfferingFields`: hidden once the offering has a teaching team. */
  showRole?: boolean
  submitting?: CourseFormSubmitting
  onSaveDraft: () => void
  onPublish: () => void
  /** Shows "Delete draft" in `editDraft` mode. */
  onDelete?: () => void
}

const defaultTitles: Record<CourseOfferingDialogMode, string> = {
  add: "Add an offering",
  editDraft: "Edit draft offering",
  correct: "Correct offering",
}

const descriptions: Record<CourseOfferingDialogMode, string> = {
  add: "Course name is all a draft needs - fields marked with an asterisk are required to publish. The term, year and dates always start empty.",
  editDraft:
    "Course name is all a draft needs - fields marked with an asterisk are required to publish.",
  correct:
    "This offering is published, so your changes go live as soon as you save them. Say what changed so readers can tell.",
}

/**
 * Adds, edits or corrects one offering of a course, with the same fields as
 * `AddCapstoneCourseDialog` minus the course code, which belongs to the course
 * rather than an offering. Presentational only, like that dialog.
 */
export function CourseOfferingDialog({
  mode,
  title = defaultTitles[mode],
  trigger,
  open,
  onOpenChange,
  values,
  onValueChange,
  fieldErrors,
  formError,
  deliveryFormatOptions,
  termOptions,
  startFrom,
  showRole,
  submitting,
  onSaveDraft,
  onPublish,
  onDelete,
}: CourseOfferingDialogProps) {
  const startFromId = React.useId()
  const changeSummaryId = React.useId()
  const correcting = mode === "correct"

  return (
    <CourseFormDialog
      description={descriptions[mode]}
      footer={
        <CourseFormFooter
          onDelete={mode === "editDraft" ? onDelete : undefined}
          onPublish={onPublish}
          // A published offering can't go back to being a draft.
          onSaveDraft={correcting ? undefined : onSaveDraft}
          publishLabel={correcting ? "Publish correction" : "Publish"}
          submitting={submitting}
        />
      }
      formError={formError}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
      trigger={trigger}
    >
      {mode === "add" && startFrom && (
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <CourseFormSelectField
            id={startFromId}
            label="Start from"
            onValueChange={startFrom.onValueChange}
            options={startFrom.options}
            placeholder="Select an offering"
            value={startFrom.value}
          />
        </FieldGroup>
      )}

      {/* Keyed on the start so its uncontrolled rich-text editors reload with it. */}
      <CourseOfferingFields
        deliveryFormatOptions={deliveryFormatOptions}
        fieldErrors={fieldErrors}
        key={startFrom?.value}
        onValueChange={onValueChange}
        showRole={showRole}
        termOptions={termOptions}
        values={values}
      />

      {correcting && (
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={changeSummaryId}>
              What changed? <RequiredAsterisk />
            </FieldLabel>
            <TextArea
              aria-invalid={Boolean(fieldErrors?.changeSummary) || undefined}
              aria-required
              id={changeSummaryId}
              onChange={(event) => onValueChange("changeSummary", event.target.value)}
              placeholder="e.g. Moved the final presentation to week 12"
              value={values.changeSummary}
            />
            {fieldErrors?.changeSummary && <FieldError>{fieldErrors.changeSummary}</FieldError>}
          </Field>
        </FieldGroup>
      )}
    </CourseFormDialog>
  )
}
