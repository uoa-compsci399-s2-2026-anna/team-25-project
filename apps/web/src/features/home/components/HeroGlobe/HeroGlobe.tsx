"use client"

import type { CSSProperties } from "react"
import type { GlobeMarker } from "../../globe.queries"
import { labelBelow } from "./labelPlacement"
import { useGlobe } from "./useGlobe"

export const HeroGlobe = ({ markers }: { markers: GlobeMarker[] }) => {
  const canvasRef = useGlobe(markers)
  const below = labelBelow(markers)

  return (
    // cobe puts an invisible anchor for each marker inside the canvas's parent,
    // so the labels must share this relative wrapper to line up with them.
    <div className="relative w-full max-w-md">
      <canvas
        aria-label="Globe - drag to rotate"
        className="aspect-square w-full cursor-grab touch-none active:cursor-grabbing"
        ref={canvasRef}
      />
      {markers.map((marker) => (
        <div
          className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-background/75 px-1.5 py-px font-medium text-[10px] leading-tight shadow-sm transition-[opacity,filter] duration-300"
          key={marker.id}
          style={
            {
              // CSS anchor positioning: centred on the marker, just above it - or just
              // below when a nearby marker to the north would otherwise share the spot.
              positionAnchor: `--cobe-${marker.id}`,
              ...(below.has(marker.id)
                ? { top: "anchor(bottom)", marginTop: 2 }
                : { bottom: "anchor(top)" }),
              left: "anchor(center)",
              // cobe sets --cobe-visible-{id} while the marker faces the viewer,
              // so labels on the far side of the globe fade and blur out.
              opacity: `var(--cobe-visible-${marker.id}, 0)`,
              filter: `blur(calc((1 - var(--cobe-visible-${marker.id}, 0)) * 8px))`,
            } as CSSProperties
          }
        >
          {marker.label}
        </div>
      ))}
    </div>
  )
}
