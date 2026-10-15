"use client"

import { Input } from "@repo/ui/components/ui"
import type { ReactNode } from "react"
import { EditField } from "./EditField"

/** A number attribute, like a year. An empty box is undefined, not 0, so it reads as missing. */
export const EditNumberInput = ({
  className,
  label,
  name,
  value,
  view,
}: {
  className?: string
  label: string
  name: string
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
        onBlur={control.onBlur}
        onChange={(e) =>
          control.setValue(e.target.value === "" ? undefined : Number(e.target.value))
        }
        type="number"
        value={control.value ?? ""}
      />
    )}
  </EditField>
)
