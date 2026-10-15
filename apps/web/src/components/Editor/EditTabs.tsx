"use client"

import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/ui"
import type { ReactNode } from "react"
import { EditField } from "./EditField"
import type { EditSelectOption } from "./EditSelect"

/** Pick one of a few values from segmented tabs, e.g. a status. */
export const EditTabs = ({
  label,
  name,
  options,
  value,
  view,
}: {
  label: string
  name: string
  options: EditSelectOption[]
  value: string
  view?: ReactNode
}) => (
  <EditField label={label} name={name} value={value} view={view}>
    {(control) => (
      <Tabs onValueChange={(next) => control.setValue(String(next))} value={control.value}>
        <TabsList aria-label={control.label} className="w-full" variant="segmented">
          {options.map((option) => (
            <TabsTrigger disabled={control.disabled} key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    )}
  </EditField>
)
