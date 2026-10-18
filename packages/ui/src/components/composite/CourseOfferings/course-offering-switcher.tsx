"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui"
import { type CourseOfferingTiming, courseOfferingTimingLabels } from "./course-offerings"

export type CourseOfferingSwitcherOption = {
  id: number
  period: string
  timing: CourseOfferingTiming
}

const optionLabel = ({ period, timing }: CourseOfferingSwitcherOption) => {
  const label = courseOfferingTimingLabels[timing]
  return label ? `${period} (${label})` : period
}

/**
 * Picks one of a course's offerings. Presentational - the caller decides what
 * picking one does, e.g. navigating to it.
 */
function CourseOfferingSwitcher({
  options,
  selectedId,
  onSelect,
  pending,
}: {
  /** Newest first. */
  options: CourseOfferingSwitcherOption[]
  selectedId: number
  /** Called with a different offering's id; reselecting the current one is a no-op. */
  onSelect: (id: number) => void
  /** Marks the trigger busy while the caller acts on a pick. */
  pending?: boolean
}) {
  const items = options.map((option) => ({ label: optionLabel(option), value: String(option.id) }))

  return (
    <Select
      items={items}
      onValueChange={(value) => {
        const id = Number(value)
        if (id && id !== selectedId) onSelect(id)
      }}
      value={String(selectedId)}
    >
      <SelectTrigger
        aria-busy={pending || undefined}
        aria-label="Offering"
        size="sm"
        variant="pill"
      >
        <SelectValue />
      </SelectTrigger>
      {/* Wider than the trigger when it needs to be, so "(Upcoming)" isn't cut off.
          Aligned to its end, as the trigger usually sits at a row's right edge. */}
      <SelectContent
        align="end"
        alignItemWithTrigger={false}
        className="w-max min-w-(--anchor-width)"
      >
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { CourseOfferingSwitcher }
