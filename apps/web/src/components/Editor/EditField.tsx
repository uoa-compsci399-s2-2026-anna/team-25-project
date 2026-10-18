"use client"

import { FieldError } from "@repo/ui/components/ui"
import { useStore } from "@tanstack/react-form"
import type { ReactNode } from "react"
import { useEdit } from "./EditContext"

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

/** Shows `children` until the page enters edit mode, then nothing. */
export const ViewOnly = ({ children }: { children: ReactNode }) =>
  useEdit().isEditing ? null : children

/** Returns an error message, or undefined when the value is fine. */
type Validator<V> = (value: V) => string | undefined

const toFieldValidator =
  <V,>(validate: Validator<V>) =>
  ({ value }: { value: unknown }) => {
    const message = validate(value as V)
    return message ? { message } : undefined
  }

/**
 * The base every Edit component is built on: swaps the view for a form field,
 * seeds the field from the saved value, and shows its validation errors.
 */
export const EditField = <V,>({
  children,
  label,
  name,
  validate,
  value,
  view,
}: {
  children: (control: EditControl<V>) => ReactNode
  /** Accessible name for the control, e.g. "First name". */
  label: string
  name: string

  validate?: Validator<V>
  /** The saved value - the field starts from it every time editing begins. */
  value: V
  view?: ReactNode
}) => {
  const { form } = useEdit()
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <EditSwitch view={view}>
      {/* The shared form is typed loosely (see EditContext), so TanStack only knows a field's
          value as unknown. These casts (and the one in toFieldValidator) bridge it to V.
          createEditFields only lets a control name a field that holds V, so they hold. */}
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
              value: field.state.value as V,
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
