"use client"

import { Input, TextArea } from "@repo/ui/components/ui"
import type { ComponentProps, ReactNode } from "react"
import { EditField, type FieldsOfType } from "./EditField"

/** A text attribute - single line by default, `multiline` for longer text like a bio. */
export const EditInput = ({
  className,
  label,
  maxLength,
  multiline = false,
  name,
  placeholder,
  value,
  view,
}: {
  className?: string
  label: string
  maxLength?: number
  multiline?: boolean
  name: FieldsOfType<string>
  placeholder?: string
  /** Payload leaves optional text fields null/undefined, so both are accepted. */
  value: string | null | undefined
  view?: ReactNode
}) => (
  <EditField label={label} name={name} value={value ?? ""} view={view}>
    {(control) => {
      const props = {
        "aria-invalid": control.invalid || undefined,
        "aria-label": control.label,
        className,
        disabled: control.disabled,
        id: control.id,
        maxLength,
        onBlur: control.onBlur,
        placeholder,
        value: control.value,
      } satisfies ComponentProps<"input"> & ComponentProps<"textarea">

      return multiline ? (
        <TextArea {...props} onChange={(e) => control.setValue(e.target.value)} />
      ) : (
        <Input {...props} onChange={(e) => control.setValue(e.target.value)} />
      )
    }}
  </EditField>
)
