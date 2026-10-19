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
import { cn } from "@repo/ui/lib/utils"
import * as React from "react"
import { RichTextEditor, type RichTextValue } from "../RichTextEditor/rich-text-editor"

// The pieces shared by the add-course and offering dialogs: the scrolling dialog
// shell, an offering's fields, and the draft/publish/delete footer.

/** One offering's fields, as the course dialogs hold them. */
export type CourseOfferingFieldValues = {
  /** A value from `termOptions`, or "" until one is picked. */
  term: string
  /** Typed into a text input, so a string until the action converts it. */
  year: string
  startDate: string
  endDate: string
  name: string
  programme: string
  deliveryFormat: string
  projectType: string
  /** `null` until the editor first reports a change. */
  learningOutcomes: RichTextValue | null
  assessments: RichTextValue | null
  additionalInfo: RichTextValue | null
  /** The signed-in member's role, for an offering published with them as its teaching team. */
  role: string
}

export type CourseFormOption = { label: string; value: string }

export type CourseFormSubmitting = "draft" | "publish" | "delete"

const requiredFields: Partial<Record<keyof CourseOfferingFieldValues, true>> = {
  deliveryFormat: true,
  endDate: true,
  name: true,
  programme: true,
  projectType: true,
  role: true,
  startDate: true,
  term: true,
  year: true,
  learningOutcomes: true,
  assessments: true,
}

export const RequiredAsterisk = () => (
  <span aria-hidden="true" className="text-destructive">
    *
  </span>
)

/**
 * A labelled text input. A field error colors only the input's border and the
 * message below it - never the label - so `Field`'s own `data-invalid` (which
 * would also tint the label text) is never set here.
 */
export function CourseFormTextField({
  id,
  label,
  required,
  value,
  onValueChange,
  error,
  className,
  ...inputProps
}: Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange"> & {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  error?: string
}) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>
        {label} {required && <RequiredAsterisk />}
      </FieldLabel>
      <Input
        aria-invalid={Boolean(error) || undefined}
        aria-required={required || undefined}
        id={id}
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
        {...inputProps}
      />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

/** A labelled select, sized to line up with the text inputs beside it. */
export function CourseFormSelectField({
  id,
  label,
  required,
  options,
  placeholder,
  value,
  onValueChange,
  error,
  className,
}: {
  id: string
  label: string
  required?: boolean
  options: CourseFormOption[]
  placeholder: string
  value: string
  onValueChange: (value: string) => void
  error?: string
  className?: string
}) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>
        {label} {required && <RequiredAsterisk />}
      </FieldLabel>
      <Select
        items={options}
        onValueChange={(next) => onValueChange(next ?? "")}
        value={value || null}
      >
        <SelectTrigger
          aria-invalid={Boolean(error) || undefined}
          aria-required={required || undefined}
          className="w-full px-3 data-[size=default]:h-10"
          id={id}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

type RichTextField = "learningOutcomes" | "assessments" | "additionalInfo"

/** Generic so a dialog can pass its own, wider values and handlers straight through. */
export type CourseOfferingFieldsProps<
  Values extends CourseOfferingFieldValues = CourseOfferingFieldValues,
> = {
  values: Values
  onValueChange: <Field extends keyof Values>(field: Field, value: Values[Field]) => void
  fieldErrors?: Partial<Record<keyof Values, string>>
  /** Kept out of the design system so it never couples to `CourseDeliveryFormat`. */
  deliveryFormatOptions: CourseFormOption[]
  /** Kept out of the design system so it never couples to `CourseTerm`. */
  termOptions: CourseFormOption[]
  /** Placed between the name and the program, e.g. the course code. */
  identityField?: React.ReactNode
  /**
   * "Your role", for an offering that will publish with the signed-in member as
   * its only teaching-team member. Left out when it already has a teaching team.
   */
  showRole?: boolean
}

/**
 * Grouped by real-world category (identity, schedule, description, content,
 * publishing) rather than one flat list - no labels on the groups themselves,
 * just wider gaps between them than within them, so proximity alone reads as
 * the grouping. Long or free-form fields span the full width; short ones share a row.
 *
 * The rich-text editors are uncontrolled, so `values` only seeds them on mount:
 * remount this (a new `key`) to load different values into them.
 */
export function CourseOfferingFields<Values extends CourseOfferingFieldValues>({
  values,
  onValueChange: onWiderValueChange,
  fieldErrors,
  deliveryFormatOptions,
  termOptions,
  identityField,
  showRole = true,
}: CourseOfferingFieldsProps<Values>) {
  // Only ever called with these fields, whose types every `Values` shares.
  const onValueChange = onWiderValueChange as CourseOfferingFieldsProps["onValueChange"]
  const baseId = React.useId()
  const idOf = (field: keyof CourseOfferingFieldValues) => `${baseId}-${field}`

  const textField = (
    field: Exclude<keyof CourseOfferingFieldValues, RichTextField>,
    label: string,
    inputProps?: Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange">,
    className?: string,
  ) => (
    <CourseFormTextField
      className={className}
      error={fieldErrors?.[field]}
      id={idOf(field)}
      label={label}
      onValueChange={(value) => onValueChange(field, value)}
      required={requiredFields[field]}
      value={values[field]}
      {...inputProps}
    />
  )

  const selectField = (
    field: "deliveryFormat" | "term",
    label: string,
    options: CourseFormOption[],
    placeholder: string,
  ) => (
    <CourseFormSelectField
      error={fieldErrors?.[field]}
      id={idOf(field)}
      label={label}
      onValueChange={(value) => onValueChange(field, value)}
      options={options}
      placeholder={placeholder}
      required={requiredFields[field]}
      value={values[field]}
    />
  )

  const richTextField = (field: RichTextField, label: string) => (
    <Field>
      <FieldLabel htmlFor={idOf(field)} id={`${idOf(field)}-label`}>
        {label} {requiredFields[field] && <RequiredAsterisk />}
      </FieldLabel>
      <RichTextEditor
        aria-invalid={Boolean(fieldErrors?.[field]) || undefined}
        aria-labelledby={`${idOf(field)}-label`}
        aria-required={requiredFields[field] || undefined}
        defaultValue={values[field]}
        id={idOf(field)}
        onChange={(value) => onValueChange(field, value)}
      />
      {fieldErrors?.[field] && <FieldError>{fieldErrors[field]}</FieldError>}
    </Field>
  )

  return (
    <>
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        {textField("name", "Course name", undefined, "md:col-span-2")}
        {identityField}
        {textField("programme", "Course program")}
      </FieldGroup>

      <FieldGroup className="grid gap-4 md:grid-cols-2">
        {selectField("term", "Term", termOptions, "Select a term")}
        {textField("year", "Year", {
          inputMode: "numeric",
          maxLength: 4,
          placeholder: "e.g. 2026",
        })}
        {textField("startDate", "Start date", { type: "date" })}
        {textField("endDate", "End date", { type: "date" })}
      </FieldGroup>

      <FieldGroup className="grid gap-4 md:grid-cols-2">
        {selectField(
          "deliveryFormat",
          "Delivery format",
          deliveryFormatOptions,
          "Select a delivery format",
        )}

        {textField("projectType", "Project type")}
      </FieldGroup>

      <FieldGroup className="gap-4">
        {richTextField("learningOutcomes", "Learning outcomes")}
        {richTextField("assessments", "Assessments")}
        {richTextField("additionalInfo", "Additional information")}
      </FieldGroup>

      {showRole && (
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          {textField("role", "Your role", { placeholder: "e.g. Course Coordinator" })}
        </FieldGroup>
      )}
    </>
  )
}

export type CourseFormDialogProps = {
  /**
   * Rendered as the dialog's trigger via `DialogTrigger`'s `render` prop. Left
   * out when something else opens the dialog through `open`.
   */
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description: React.ReactNode
  formError?: string
  footer: React.ReactNode
  children: React.ReactNode
}

/** The dialog both course forms open in: a title, a Cancel button, the fields, then the footer. */
export function CourseFormDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  formError,
  footer,
  children,
}: CourseFormDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      {trigger && <DialogTrigger render={trigger} />}
      {/* The popup only clips to its rounded corners; the inner wrapper does the
          scrolling. Scrolling the popup itself paints the scrollbar square over
          its right-hand corners. */}
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        showCloseButton={false}
      >
        <div className="min-h-0 overflow-y-auto p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <DialogTitle className="font-bold text-2xl">{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
            <DialogClose render={<Button size="sm" variant="button-transparent" />}>
              Cancel
            </DialogClose>
          </div>

          <div className="flex flex-col gap-8 pt-6">{children}</div>

          {formError && (
            <FieldError className="mt-4" role="alert">
              {formError}
            </FieldError>
          )}

          {footer}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export type CourseFormFooterProps = {
  /** Which action is in flight, so only that button shows a loading label. */
  submitting?: CourseFormSubmitting
  /** Left out where saving a draft isn't possible, e.g. correcting a published offering. */
  onSaveDraft?: () => void
  onPublish: () => void
  /** Defaults to "Publish". */
  publishLabel?: string
  /** Shows a "Delete draft" button, which asks to confirm before calling this. */
  onDelete?: () => void
}

/**
 * Save draft and Publish, plus "Delete draft" when `onDelete` is given. The
 * delete confirm lives here, so it resets whenever the dialog closes and
 * unmounts its content.
 */
export function CourseFormFooter({
  submitting,
  onSaveDraft,
  onPublish,
  publishLabel = "Publish",
  onDelete,
}: CourseFormFooterProps) {
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)

  return (
    <DialogFooter className={cn("mt-6", onDelete && "sm:items-center sm:justify-between")}>
      {confirmingDelete ? (
        <>
          <p className="text-sm">Delete this draft? This can't be undone.</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              borderColor="charcoal"
              onClick={() => setConfirmingDelete(false)}
              type="button"
              variant="button-transparent"
            >
              {/* Not "Cancel" - the header already has one. */}
              Keep draft
            </Button>
            <Button
              onClick={() => {
                setConfirmingDelete(false)
                onDelete?.()
              }}
              type="button"
              variant="button-destructive"
            >
              Confirm delete
            </Button>
          </div>
        </>
      ) : (
        <>
          {onDelete && (
            <Button
              disabled={Boolean(submitting)}
              onClick={() => setConfirmingDelete(true)}
              type="button"
              variant="button-destructive-outline"
            >
              {submitting === "delete" ? "Deleting..." : "Delete draft"}
            </Button>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {onSaveDraft && (
              <Button
                borderColor="charcoal"
                disabled={Boolean(submitting)}
                onClick={onSaveDraft}
                type="button"
                variant="button-transparent"
              >
                {submitting === "draft" ? "Saving..." : "Save draft"}
              </Button>
            )}
            <Button
              disabled={Boolean(submitting)}
              onClick={onPublish}
              type="button"
              variant="button-mauve"
            >
              {submitting === "publish" ? "Publishing..." : publishLabel}
            </Button>
          </div>
        </>
      )}
    </DialogFooter>
  )
}
