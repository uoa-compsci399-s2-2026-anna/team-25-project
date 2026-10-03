"use client"

import { FieldError } from "@repo/ui/components/ui"
import { useStore } from "@tanstack/react-form"
import type { ReactNode } from "react"
import { type ProfileValues, useEdit } from "./EditContext"

/** The profile fields whose value is of type V, e.g. FieldsOfType<string> = "firstName" | ... */
export type FieldsOfType<V> = {
  [K in keyof ProfileValues]: ProfileValues[K] extends V ? K : never
}[keyof ProfileValues]

/** What a control needs to draw itself - kept free of TanStack's FieldApi generics. */
export type EditControl<V> = {
  id: string
  label: string
  value: V
  setValue: (value: V) => void
  onBlur: () => void
  disabled: boolean
  invalid: boolean
}

/** Shows `view` until the page enters edit mode, then `children`. */
export const EditSwitch = ({ children, view }: { children: ReactNode; view?: ReactNode }) =>
  useEdit().isEditing ? children : view

/** Returns an error message, or undefined when the value is fine. */
type Validator<V> = (value: V) => string | undefined

const toFieldValidator =
  <V,>(validate: Validator<V>) =>
  ({ value }: { value: V }) => {
    const message = validate(value)
    return message ? { message } : undefined
  }

/**
 * The base every Edit component is built on: swaps the view for a form field,
 * seeds the field from the saved value, and shows its validation errors.
 */
export const EditField = <K extends keyof ProfileValues>({
  children,
  label,
  name,
  validate,
  value,
  view,
}: {
  children: (control: EditControl<ProfileValues[K]>) => ReactNode
  /** Accessible name for the control, e.g. "First name". */
  label: string
  name: K

  validate?: Validator<ProfileValues[K]>
  /** The saved value - the field starts from it every time editing begins. */
  value: ProfileValues[K]
  view?: ReactNode
}) => {
  const { form } = useEdit()
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <EditSwitch view={view}>
      {/* TanStack types a generic K's value as DeepValue<ProfileValues, K>, which TS can't
          reduce to ProfileValues[K] - they're the same type for a top-level key. These
          three casts are the only bridge between the two, so callers stay fully typed. */}
      <form.Field
        defaultValue={value as never}
        name={name}
        validators={validate ? { onChange: toFieldValidator(validate) } : undefined}
      >
        {(field) => (
          <div className="flex flex-col gap-1">
            {children({
              id: `edit-${name}`,
              label,
              value: field.state.value as ProfileValues[K],
              setValue: (next) => field.handleChange(next as never),
              onBlur: field.handleBlur,
              disabled: isSubmitting,
              invalid: field.state.meta.errors.length > 0,
            })}
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>
    </EditSwitch>
  )
}
