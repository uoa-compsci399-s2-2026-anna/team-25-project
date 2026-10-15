"use client"

import { Checkbox, Label } from "@repo/ui/components/ui"
import type { ReactNode } from "react"
import { EditField } from "./EditField"
import type { EditSelectOption } from "./EditSelect"

/** Pick any number of values from a fixed list, kept in the options' order. */
export const EditCheckboxList = ({
  label,
  name,
  options,
  value,
  view,
}: {
  label: string
  name: string
  options: EditSelectOption[]
  value: string[] | null | undefined
  view?: ReactNode
}) => (
  <EditField<string[]> label={label} name={name} value={value ?? []} view={view}>
    {(control) => (
      <fieldset className="flex flex-col gap-2" disabled={control.disabled}>
        <legend className="sr-only">{control.label}</legend>
        {options.map((option) => (
          <div className="flex items-center gap-2" key={option.value}>
            <Checkbox
              checked={control.value.includes(option.value)}
              id={`${control.id}-${option.value}`}
              onCheckedChange={(checked) =>
                control.setValue(
                  options
                    .map((o) => o.value)
                    .filter((v) => (v === option.value ? checked : control.value.includes(v))),
                )
              }
            />
            <Label className="font-normal" htmlFor={`${control.id}-${option.value}`}>
              {option.label}
            </Label>
          </div>
        ))}
      </fieldset>
    )}
  </EditField>
)
