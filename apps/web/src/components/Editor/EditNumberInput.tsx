"use client"

import { Input } from "@repo/ui/components/ui"
import type { ReactNode } from "react"
import { EditField } from "./EditField"

/**
 * A number attribute, like a year. An empty box is undefined rather than 0, so the schema
 * reports it as missing instead of out of range.
 */
export const EditNumberInput = ({
  className,
  label,
  max,
  min,
  name,
  placeholder,
  value,
  view,
}: {
  className?: string
  label: string
  max?: number
  min?: number
  name: string
  placeholder?: string
  value: number | null | undefined
  view?: ReactNode
}) => (
  <EditField<number | undefined> label={label} name={name} value={value ?? undefined} view={view}>
    {(control) => (
      <Input
        aria-invalid={control.invalid || undefined}
        aria-label={control.label}
        className={className}
        disabled={control.disabled}
        id={control.id}
        inputMode="numeric"
        max={max}
        min={min}
        onBlur={control.onBlur}
        onChange={(e) =>
          control.setValue(e.target.value === "" ? undefined : Number(e.target.value))
        }
        placeholder={placeholder}
        type="number"
        value={control.value ?? ""}
      />
    )}
  </EditField>
)
