"use client"

import { type CSSProperties, useState } from "react"
import type { GlobeMarker } from "../../globe.queries"
import { labelBelow, sameSpot } from "./labelPlacement"
import { useGlobe } from "./useGlobe"

export const HeroGlobe = ({ markers }: { markers: GlobeMarker[] }) => {
  const canvasRef = useGlobe(markers)
  const below = labelBelow(markers)
  // Labels stay hidden until their marker is hovered, so the globe isn't cluttered.
  const [hovered, setHovered] = useState<string | null>(null)
  const shown = sameSpot(markers, hovered)

  return (
    // cobe puts an invisible anchor for each marker inside the canvas's parent,
    // so the labels must share this relative wrapper to line up with them.
    <div className="relative w-full max-w-md">
      <canvas
        aria-label="Globe - drag to rotate"
        className="aspect-square w-full cursor-grab touch-none active:cursor-grabbing"
        ref={canvasRef}
      />
      {/* A blue ping around each marker - the dot itself stays put. It's also the hover
          target for the marker's label, so it's a little larger than the ping. Rendered
          before the labels so they sit on top of it. */}
      {markers.map((marker) => (
        <div
          aria-hidden
          className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center transition-opacity duration-800"
          data-testid={`marker-pulse-${marker.id}`}
          key={`${marker.id}-pulse`}
          onPointerEnter={() => setHovered(marker.id)}
          onPointerLeave={() => setHovered((id) => (id === marker.id ? null : id))}
          style={
            {
              positionAnchor: `--cobe-${marker.id}`,
              top: "anchor(center)",
              left: "anchor(center)",
              // Hidden on the far side of the globe, like the labels. The ping animates
              // opacity on the inner span, so this fade has to live out here.
              opacity: `var(--cobe-visible-${marker.id}, 0)`,
            } as CSSProperties
          }
        >
          {/* #3366ff matches markerColor in useGlobe.ts. */}
          <span className="size-3 rounded-full bg-[#3366ff] motion-safe:animate-ping" />
        </div>
      ))}
      {markers.map((marker) => (
        <div
          className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-background px-1.5 py-px font-medium text-[10px] leading-tight shadow-sm transition-[opacity,filter] duration-300"
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
              // so a hovered label on the far side of the globe still fades and blurs out.
              opacity: shown.has(marker.id) ? `var(--cobe-visible-${marker.id}, 0)` : 0,
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
