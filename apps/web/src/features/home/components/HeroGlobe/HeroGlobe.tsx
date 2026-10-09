"use client"

import type { CSSProperties } from "react"
import { GLOBE_MARKERS, useGlobe } from "./useGlobe"

export const HeroGlobe = () => {
  const canvasRef = useGlobe()

  return (
    // cobe puts an invisible anchor for each marker inside the canvas's parent,
    // so the labels must share this relative wrapper to line up with them.
    <div className="relative w-full max-w-md">
      <canvas
        aria-label="Globe - drag to rotate"
        className="aspect-square w-full cursor-grab touch-none active:cursor-grabbing"
        ref={canvasRef}
      />
      {GLOBE_MARKERS.map((marker) => (
        <div
          className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-background/90 px-2 py-0.5 font-medium text-xs shadow-sm transition-[opacity,filter] duration-300"
          key={marker.id}
          style={
            {
              // CSS anchor positioning: sit just above the marker, centred on it.
              positionAnchor: `--cobe-${marker.id}`,
              bottom: "anchor(top)",
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
