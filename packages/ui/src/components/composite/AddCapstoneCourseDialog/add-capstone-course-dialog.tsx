"use client"

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui"
import * as React from "react"
import { RichTextEditor, type RichTextValue } from "../RichTextEditor/rich-text-editor"

export type AddCapstoneCourseDialogValues = {
  code: string
  period: string
  startDate: string
  endDate: string
  name: string
  programme: string
  deliveryFormat: string
  projectType: string
  /** `null` until the editor first reports a change. */
  learningOutcomes: RichTextValue | null
  assessments: RichTextValue | null
  /** The signed-in creator's role in the offering - only required to publish. */
  role: string
}

type RichTextField = "learningOutcomes" | "assessments"

export type AddCapstoneCourseDialogFieldErrors = Partial<
  Record<keyof AddCapstoneCourseDialogValues, string>
>

export type AddCapstoneCourseDialogOption = { label: string; value: string }

export type AddCapstoneCourseDialogProps = {
  /** Rendered as the dialog's trigger via `DialogTrigger`'s `render` prop. */
  trigger: React.ReactElement
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
  /** Which action is in flight, so only that button shows a loading label. */
  submitting?: "draft" | "publish"
  onSaveDraft: () => void
  onPublish: () => void
}

/**
 * Presentational only - the caller owns form state and the actual submit
 * behaviour, so this can be driven from a Storybook control just as easily as
 * from the real create-course action.
 */
export function AddCapstoneCourseDialog({
  trigger,
  open,
  onOpenChange,
  values,
  onValueChange,
  fieldErrors,
  formError,
  deliveryFormatOptions,
  submitting,
  onSaveDraft,
  onPublish,
}: AddCapstoneCourseDialogProps) {
  const ids = {
    assessments: React.useId(),
    code: React.useId(),
    deliveryFormat: React.useId(),
    endDate: React.useId(),
    learningOutcomes: React.useId(),
    name: React.useId(),
    period: React.useId(),
    programme: React.useId(),
    projectType: React.useId(),
    role: React.useId(),
    startDate: React.useId(),
  }

  // A field error colors only the input's border and the message below it -
  // never the label - so `Field`'s own `data-invalid` (which would also tint
  // the label text) is never set here.
  const textField = (
    field: Exclude<keyof AddCapstoneCourseDialogValues, RichTextField>,
    label: string,
    inputProps?: React.ComponentProps<typeof Input>,
  ) => (
    <Field>
      <FieldLabel htmlFor={ids[field]}>{label}</FieldLabel>
      <Input
        aria-invalid={Boolean(fieldErrors?.[field]) || undefined}
        id={ids[field]}
        onChange={(event) => onValueChange(field, event.target.value)}
        value={values[field]}
        {...inputProps}
      />
      {fieldErrors?.[field] && <FieldError>{fieldErrors[field]}</FieldError>}
    </Field>
  )

  // The editor is uncontrolled, so `values` only seeds it. It remounts empty each time the
  // dialog opens, because the dialog unmounts its content when it closes.
  const richTextField = (field: RichTextField, label: string) => (
    <Field>
      <FieldLabel htmlFor={ids[field]} id={`${ids[field]}-label`}>
        {label}
      </FieldLabel>
      <RichTextEditor
        aria-invalid={Boolean(fieldErrors?.[field]) || undefined}
        aria-labelledby={`${ids[field]}-label`}
        defaultValue={values[field]}
        id={ids[field]}
        onChange={(value) => onValueChange(field, value)}
      />
      {fieldErrors?.[field] && <FieldError>{fieldErrors[field]}</FieldError>}
    </Field>
  )

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger render={trigger} />
      <DialogContent
        className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-3xl"
        showCloseButton={false}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <DialogTitle className="font-bold text-2xl">Add a capstone course</DialogTitle>
            <DialogDescription>
              Course code and name are all a draft needs - everything else here is for when you
              publish.
            </DialogDescription>
          </div>
          <DialogClose render={<Button size="sm" variant="button-transparent" />}>
            Cancel
          </DialogClose>
        </div>

        {/* Grouped by real-world category (identity, schedule, description,
            content, publishing) rather than one flat list - no labels on the
            groups themselves, just wider gaps between them than within them,
            so proximity alone reads as the grouping. */}
        <div className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-2">
          <div className="flex flex-col gap-8">
            <FieldGroup className="gap-4">
              {textField("code", "Course code", { placeholder: "e.g. CS399" })}
              {textField("name", "Course name")}
            </FieldGroup>

            <FieldGroup className="gap-4">
              {textField("period", "Teaching period", {
                // "<year> <term>" - the table's splitPeriod parses the first
                // token as the year, so this order isn't just cosmetic.
                placeholder: "e.g. 2026 Semester 2",
              })}
              <div className="grid grid-cols-2 gap-4">
                {textField("startDate", "Start date", { type: "date" })}
                {textField("endDate", "End date", { type: "date" })}
              </div>
            </FieldGroup>

            <FieldGroup className="gap-4">
              {textField("programme", "Course program")}

              <Field>
                <FieldLabel htmlFor={ids.deliveryFormat}>Delivery format</FieldLabel>
                <Select
                  items={deliveryFormatOptions}
                  onValueChange={(next) => onValueChange("deliveryFormat", next ?? "")}
                  value={values.deliveryFormat || null}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(fieldErrors?.deliveryFormat) || undefined}
                    className="w-full px-3 data-[size=default]:h-10"
                    id={ids.deliveryFormat}
                  >
                    <SelectValue placeholder="Select a delivery format" />
                  </SelectTrigger>
                  <SelectContent align="start" alignItemWithTrigger={false}>
                    {deliveryFormatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors?.deliveryFormat && (
                  <FieldError>{fieldErrors.deliveryFormat}</FieldError>
                )}
              </Field>

              {textField("projectType", "Project type")}
            </FieldGroup>
          </div>

          <div className="flex flex-col gap-8">
            <FieldGroup>
              {richTextField("learningOutcomes", "Learning outcomes")}
              {richTextField("assessments", "Assessments")}
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={ids.role}>Your role</FieldLabel>
                <Input
                  aria-invalid={Boolean(fieldErrors?.role) || undefined}
                  id={ids.role}
                  onChange={(event) => onValueChange("role", event.target.value)}
                  placeholder="e.g. Course Coordinator"
                  value={values.role}
                />
                {fieldErrors?.role && <FieldError>{fieldErrors.role}</FieldError>}
              </Field>
            </FieldGroup>
          </div>
        </div>

        {formError && (
          <FieldError className="mt-4" role="alert">
            {formError}
          </FieldError>
        )}

        <DialogFooter className="mt-6">
          <Button
            borderColor="charcoal"
            disabled={Boolean(submitting)}
            onClick={onSaveDraft}
            type="button"
            variant="button-transparent"
          >
            {submitting === "draft" ? "Saving..." : "Save draft"}
          </Button>
          <Button
            disabled={Boolean(submitting)}
            onClick={onPublish}
            type="button"
            variant="button-mauve"
          >
            {submitting === "publish" ? "Publishing..." : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
