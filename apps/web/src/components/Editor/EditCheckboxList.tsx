"use client"

import { Checkbox, Label } from "@repo/ui/components/ui"
import type { ReactNode } from "react"
import { EditField } from "./EditField"

export type EditCheckboxOption = { label: string; value: string }

/**
 * Pick any number of values from a fixed list, e.g. proposal tags. Unlike EditTagList, nothing
 * outside `options` can be entered. Picked values are kept in the options' order.
 */
export const EditCheckboxList = ({
  label,
  name,
  options,
  value,
  view,
}: {
  label: string
  name: string
  options: EditCheckboxOption[]
  value: string[] | null | undefined
  view?: ReactNode
}) => (
  <EditField<string[]> label={label} name={name} value={value ?? []} view={view}>
    {(control) => {
      const toggle = (option: string, checked: boolean) => {
        const picked = new Set(control.value)
        if (checked) picked.add(option)
        else picked.delete(option)
        control.setValue(options.map((o) => o.value).filter((v) => picked.has(v)))
      }

      return (
        <fieldset
          aria-invalid={control.invalid || undefined}
          className="flex flex-col gap-2"
          id={control.id}
          onBlur={control.onBlur}
        >
          <legend className="sr-only">{control.label}</legend>
          {options.map((option) => {
            const id = `${control.id}-${option.value}`
            return (
              <div className="flex items-center gap-2" key={option.value}>
                <Checkbox
                  checked={control.value.includes(option.value)}
                  disabled={control.disabled}
                  id={id}
                  onCheckedChange={(checked) => toggle(option.value, checked)}
                />
                <Label className="font-normal" htmlFor={id}>
                  {option.label}
                </Label>
              </div>
            )
          })}
        </fieldset>
      )
    }}
  </EditField>
)
