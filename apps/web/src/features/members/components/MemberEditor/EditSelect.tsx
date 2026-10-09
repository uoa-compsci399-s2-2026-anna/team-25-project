"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui"
import type { ReactNode } from "react"
import { EditField, type FieldsOfType } from "./EditField"

export type EditSelectOption = { label: string; value: string }

/**
 * Pick one value from a fixed list. Pass `toSelectOptions(SomeLabels)` so the
 * options come straight from the enum. `nullLabel` adds a "no value" item.
 */
export const EditSelect = ({
  className,
  label,
  name,
  nullLabel,
  options,
  value,
  view,
}: {
  className?: string
  label: string
  name: FieldsOfType<string | null>
  /** Shown for, and as the item that clears to, null - e.g. "None". Omit to require a value. */
  nullLabel?: string
  options: EditSelectOption[]
  value: string | null | undefined
  view?: ReactNode
}) => {
  const labelFor = (selected: string | null) =>
    options.find((option) => option.value === selected)?.label ?? nullLabel ?? ""

  return (
    <EditField label={label} name={name} value={value ?? null} view={view}>
      {(control) => (
        <Select
          disabled={control.disabled}
          onValueChange={(next) => control.setValue(next as string | null)}
          value={control.value}
        >
          <SelectTrigger
            aria-invalid={control.invalid || undefined}
            aria-label={control.label}
            className={className}
            id={control.id}
            onBlur={control.onBlur}
          >
            <SelectValue placeholder={nullLabel}>{labelFor}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false}>
            {nullLabel !== undefined && <SelectItem value={null}>{nullLabel}</SelectItem>}
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </EditField>
  )
}
