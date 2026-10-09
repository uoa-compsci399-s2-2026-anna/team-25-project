import type { GlobeMarker } from "../../globe.queries"

// Markers closer than this (in degrees) get their labels split above/below.
const CROWDED_DEGREES = 10
// Markers closer than this share most of their 24px hover target (a degree is roughly 4px
// on the hero globe), so the one rendered last would swallow every hover.
const SAME_SPOT_DEGREES = 3

const distance = (a: GlobeMarker, b: GlobeMarker) =>
  Math.hypot(a.location[0] - b.location[0], a.location[1] - b.location[1])

/**
 * Ids of markers whose label should sit below the marker rather than above: those with
 * another marker close by to the north, so the pair's labels fan out instead of colliding.
 * Treats lat/lng as a flat grid - plenty accurate at this scale.
 */
export const labelBelow = (markers: GlobeMarker[]): Set<string> =>
  new Set(
    markers
      .filter((marker) =>
        markers.some(
          (other) =>
            other.id !== marker.id &&
            other.location[0] > marker.location[0] &&
            distance(other, marker) < CROWDED_DEGREES,
        ),
      )
      .map(({ id }) => id),
  )

/**
 * Ids of the markers whose labels to show while `id` is hovered: the marker itself plus any
 * sitting on practically the same spot, since those can't be hovered separately.
 */
export const sameSpot = (markers: GlobeMarker[], id: string | null): Set<string> => {
  const hovered = markers.find((marker) => marker.id === id)
  if (!hovered) return new Set()
  return new Set(
    markers
      .filter((marker) => distance(marker, hovered) < SAME_SPOT_DEGREES)
      .map((marker) => marker.id),
  )
}
