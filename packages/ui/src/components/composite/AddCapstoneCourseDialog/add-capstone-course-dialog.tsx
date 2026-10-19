"use client"

import * as React from "react"
import {
  CourseFormDialog,
  CourseFormFooter,
  type CourseFormOption,
  type CourseFormSubmitting,
  CourseFormTextField,
  CourseOfferingFields,
  type CourseOfferingFieldValues,
} from "../CourseForm/course-form"

export type AddCapstoneCourseDialogValues = CourseOfferingFieldValues & {
  code: string
}

export type AddCapstoneCourseDialogFieldErrors = Partial<
  Record<keyof AddCapstoneCourseDialogValues, string>
>

export type AddCapstoneCourseDialogOption = CourseFormOption

export type AddCapstoneCourseDialogProps = {
  /**
   * Rendered as the dialog's trigger via `DialogTrigger`'s `render` prop. Left
   * out when something else opens the dialog through `open`, e.g. reopening a
   * saved draft from a table row.
   */
  trigger?: React.ReactElement
  /** Defaults to "Add a capstone course". */
  title?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  values: AddCapstoneCourseDialogValues
  onValueChange: <Field extends keyof AddCapstoneCourseDialogValues>(
    field: Field,
    value: AddCapstoneCourseDialogValues[Field],
  ) => void
  fieldErrors?: AddCapstoneCourseDialogFieldErrors
  formError?: string
  /** Kept out of the design system so it never couples to `CourseDeliveryFormat`. */
  deliveryFormatOptions: AddCapstoneCourseDialogOption[]
  /** Kept out of the design system so it never couples to `CourseTerm`. */
  termOptions: AddCapstoneCourseDialogOption[]
  /** Which action is in flight, so only that button shows a loading label. */
  submitting?: CourseFormSubmitting
  onSaveDraft: () => void
  onPublish: () => void
  /** Shows a "Delete draft" button, which asks to confirm before calling this. */
  onDelete?: () => void
}

/**
 * Presentational only - the caller owns form state and the actual submit
 * behaviour, so this can be driven from a Storybook control just as easily as
 * from the real create-course action.
 */
export function AddCapstoneCourseDialog({
  trigger,
  title = "Add a capstone course",
  open,
  onOpenChange,
  values,
  onValueChange,
  fieldErrors,
  formError,
  deliveryFormatOptions,
  termOptions,
  submitting,
  onSaveDraft,
  onPublish,
  onDelete,
}: AddCapstoneCourseDialogProps) {
  const codeId = React.useId()

  return (
    <CourseFormDialog
      // The asterisk is described in words rather than shown inline, so this
      // still reads as a sentence with the decorative marks stripped out.
      description="Course code and name are all a draft needs - fields marked with an asterisk are required to publish."
      footer={
        <CourseFormFooter
          onDelete={onDelete}
          onPublish={onPublish}
          onSaveDraft={onSaveDraft}
          submitting={submitting}
        />
      }
      formError={formError}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
      trigger={trigger}
    >
      <CourseOfferingFields
        deliveryFormatOptions={deliveryFormatOptions}
        fieldErrors={fieldErrors}
        identityField={
          <CourseFormTextField
            error={fieldErrors?.code}
            id={codeId}
            label="Course code"
            onValueChange={(value) => onValueChange("code", value)}
            placeholder="e.g. CS399"
            required
            value={values.code}
          />
        }
        onValueChange={onValueChange}
        termOptions={termOptions}
        values={values}
      />
    </CourseFormDialog>
  )
}
