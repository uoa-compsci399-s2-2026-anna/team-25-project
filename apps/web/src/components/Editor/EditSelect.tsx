"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui"
import type { ReactNode } from "react"
import { EditField } from "./EditField"

export type EditSelectOption<V extends string | number = string> = { label: string; value: V }

/**
 * Pick one value from a fixed list. Pass `toSelectOptions(SomeLabels)` so the
 * options come straight from the enum, or ids for a relationship. `nullLabel` adds a
 * "no value" item.
 */
export const EditSelect = <V extends string | number>({
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
  name: string
  /** Shown for, and as the item that clears to, null - e.g. "None". Omit to require a value. */
  nullLabel?: string
  options: EditSelectOption<V>[]
  value: V | null | undefined
  view?: ReactNode
}) => {
  const labelFor = (selected: V | null) =>
    options.find((option) => option.value === selected)?.label ?? nullLabel ?? ""

  return (
    <EditField label={label} name={name} value={value ?? null} view={view}>
      {(control) => (
        <Select
          disabled={control.disabled}
          onValueChange={(next) => control.setValue(next as V | null)}
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
              <SelectItem key={String(option.value)} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </EditField>
  )
}
