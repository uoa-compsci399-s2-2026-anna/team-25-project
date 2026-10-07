import type { GlobeMarker } from "../../globe.queries"

// Markers closer than this (in degrees) get their labels split above/below.
const CROWDED_DEGREES = 10

/**
 * Ids of markers whose label should sit below the marker rather than above: those with
 * another marker close by to the north, so the pair's labels fan out instead of colliding.
 * Treats lat/lng as a flat grid - plenty accurate at this scale.
 */
export const labelBelow = (markers: GlobeMarker[]): Set<string> =>
  new Set(
    markers
      .filter(({ id, location: [lat, lng] }) =>
        markers.some(
          (other) =>
            other.id !== id &&
            other.location[0] > lat &&
            Math.hypot(other.location[0] - lat, other.location[1] - lng) < CROWDED_DEGREES,
        ),
      )
      .map(({ id }) => id),
  )
