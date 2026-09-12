"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui"

export type InstitutionOption = {
  domains: string[]
  id: number
  name: string
}

type InstitutionSelectProps = {
  id: string
  institutions: InstitutionOption[]
  invalid?: boolean
  name: string
  onValueChange: (value: string) => void
  value: string
}

export const InstitutionSelect = ({
  id,
  institutions,
  invalid,
  name,
  onValueChange,
  value,
}: InstitutionSelectProps) => {
  // `items` lets Select.Value render the institution's name rather than its id.
  const items = institutions.map((institution) => ({
    label: institution.name,
    value: String(institution.id),
  }))

  return (
    <Select
      items={items}
      modal={false}
      name={name}
      onValueChange={(next) => onValueChange(next ?? "")}
      value={value || null}
    >
      {/* Matches the trigger's own `data-[size=default]:h-8` modifier - a plain
          h-10 loses to it on specificity and the control renders 8px short. */}
      <SelectTrigger
        aria-invalid={invalid}
        className="w-full px-3 data-[size=default]:h-10"
        id={id}
      >
        <SelectValue placeholder="Select your university or institution" />
      </SelectTrigger>
      {/* alignItemWithTrigger would sit the selected item over the trigger, so the
          list jumps upward once a lower option is picked. Anchor it to the
          trigger's start edge and open below instead. */}
      <SelectContent align="start" alignItemWithTrigger={false}>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
