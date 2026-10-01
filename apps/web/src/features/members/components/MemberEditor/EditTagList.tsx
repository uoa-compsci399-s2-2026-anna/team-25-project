"use client"

import { Badge, Button, Input } from "@repo/ui/components/ui"
import type { ReactNode } from "react"
import { EditField, type FieldsOfType } from "./EditField"

export const EditTagList = ({
  itemLabel,
  label,
  max,
  maxLength,
  name,
  value,
  view,
}: {
  /** Names one tag for screen readers, e.g. "research interest". */
  itemLabel: string
  label: string
  max?: number
  maxLength?: number
  name: FieldsOfType<string[]>
  value: string[] | null | undefined
  view?: ReactNode
}) => (
  <EditField label={label} name={name} value={value ?? []} view={view}>
    {({ disabled, label: listLabel, setValue, value: items }) => {
      const update = (index: number, next: string) =>
        setValue(items.map((item, i) => (i === index ? next : item)))
      const remove = (index: number) => setValue(items.filter((_, i) => i !== index))
      const isFull = max !== undefined && items.length >= max

      return (
        <ul aria-label={listLabel} className="flex flex-wrap items-center gap-1">
          {items.map((item, index) => (
            // The index, not the text, is the key - the text changes on every keystroke.
            // biome-ignore lint/suspicious/noArrayIndexKey: see above
            <li key={index}>
              <Badge className="h-7 pl-1">
                <Button
                  aria-label={`Remove ${item || itemLabel}`}
                  className="bg-destructive text-white"
                  disabled={disabled}
                  onClick={() => remove(index)}
                  size="icon-xs"
                  variant="button-unstyled"
                >
                  -
                </Button>
                <Input
                  aria-label={`${itemLabel} ${index + 1}`}
                  className="h-auto w-24 border-0 px-1 font-medium hover:bg-transparent focus-visible:ring-0"
                  disabled={disabled}
                  maxLength={maxLength}
                  onChange={(e) => update(index, e.target.value)}
                  value={item}
                  variant="pill"
                />
              </Badge>
            </li>
          ))}
          <li>
            <Button
              aria-label={`Add ${itemLabel}`}
              disabled={disabled || isFull}
              onClick={() => setValue([...items, ""])}
              size="icon-xs"
              variant="button-cream"
            >
              +
            </Button>
          </li>
        </ul>
      )
    }}
  </EditField>
)
