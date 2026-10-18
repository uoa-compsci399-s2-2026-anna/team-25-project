import type { CourseVersion } from "@repo/shared/payload-types"

export type OfferingTiming = "upcoming" | "inProgress" | "ended"

type Dated = Pick<CourseVersion, "startDate" | "endDate">

const time = (value: string | null | undefined) => (value ? Date.parse(value) : Number.NaN)

/**
 * Where an offering sits relative to `now`. Publication requires both dates;
 * a missing end date is treated as never ending only so a bad row can't throw.
 */
export const offeringTiming = (offering: Dated, now: Date): OfferingTiming => {
  if (time(offering.startDate) > now.getTime()) return "upcoming"
  if (time(offering.endDate) < now.getTime()) return "ended"
  return "inProgress"
}

/**
 * The offering a course page shows by default: the newest one that has started,
 * so publishing next year's offering early doesn't hide this year's. With none
 * started yet, it's the soonest upcoming one.
 *
 * `offerings` must be newest first, as `getPublishedOfferings` returns them.
 */
export const currentOffering = <T extends Dated>(offerings: T[], now: Date): T | undefined =>
  offerings.find((offering) => offeringTiming(offering, now) !== "upcoming") ?? offerings.at(-1)

/**
 * `selected` is what the page shows: the requested offering, or the current one.
 * Either the course has offerings and both are set, or it has none and neither is.
 */
export type OfferingSelection<T> =
  | { offerings: T[]; selected: T; current: T }
  | { offerings: []; selected: undefined; current: undefined }

/**
 * An `offeringId` the course doesn't have - another course's, or one never
 * published - falls back to the current offering rather than 404ing the page.
 */
export const selectOffering = <T extends Dated & { id: number }>(
  offerings: T[],
  offeringId: number | null | undefined,
  now: Date,
): OfferingSelection<T> => {
  const current = currentOffering(offerings, now)
  if (!current) return { offerings: [], selected: undefined, current: undefined }

  const requested = offeringId
    ? offerings.find((offering) => offering.id === offeringId)
    : undefined
  return { offerings, selected: requested ?? current, current }
}
