import type { CourseVersion } from "@repo/shared/payload-types"

/**
 * Pinned so the server and browser agree; a reader's own zone could otherwise
 * format the same timestamp a day earlier and trip a hydration mismatch.
 */
const dateFormatter = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
  timeZone: "Pacific/Auckland",
  year: "numeric",
})

// Intl throws on an invalid date rather than formatting one, so a bad value
// drops its own line instead of taking the whole page down.
export const formatDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date)
}

export const periodRange = (offering: CourseVersion) => {
  const start = formatDate(offering.startDate)
  const end = formatDate(offering.endDate)
  if (!start || !end) return start ?? end
  return `${start} - ${end}`
}
