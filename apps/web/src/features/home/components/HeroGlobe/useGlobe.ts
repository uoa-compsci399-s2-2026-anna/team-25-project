import createGlobe from "cobe"
import { useEffect, useRef } from "react"

const DRAG_SPEED = 0.005
// How far up or down the globe can tilt, in radians (about 70°), so it can't flip over a pole.
const MAX_TILT = 1.2

export type GlobeMarker = {
  id: string
  location: [lat: number, lng: number]
  label: string
}

export const GLOBE_MARKERS: GlobeMarker[] = [
  { id: "sydney", location: [-33.87, 151.21], label: "Sydney" },
  { id: "auckland", location: [-36.85, 174.76], label: "Auckland" },
]

export const useGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Starts where the globe is drawn, so the first drag doesn't jump back to 0.
    let phi = 2.4
    let theta = -0.3
    const globe = createGlobe(canvas, {
      devicePixelRatio: 1,
      width: 600 * 2,
      height: 600 * 2,
      phi,
      theta,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [1, 1, 1],
      markerColor: [0.2, 0.4, 1],
      glowColor: [1, 1, 1],
      markers: GLOBE_MARKERS.map((marker) => ({
        id: marker.id,
        location: marker.location,
        size: 0.03,
      })),
      arcColor: [0.3, 0.5, 1],
      arcWidth: 0.5,
      arcHeight: 0.3,
    })

    let frame = 0
    const start = performance.now()
    function redraw() {
      globe.update({})
      if (performance.now() - start < 1000) frame = requestAnimationFrame(redraw)
    }
    frame = requestAnimationFrame(redraw)

    // Sideways drags spin the globe (phi), up/down drags tilt it (theta).
    let last: { x: number; y: number } | null = null
    const onPointerDown = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY }
      canvas.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (last === null) return
      phi += (e.clientX - last.x) * DRAG_SPEED
      theta = Math.min(MAX_TILT, Math.max(-MAX_TILT, theta + (e.clientY - last.y) * DRAG_SPEED))
      last = { x: e.clientX, y: e.clientY }
      globe.update({ phi, theta })
    }
    const onPointerUp = () => {
      last = null
    }

    canvas.addEventListener("pointerdown", onPointerDown)
    canvas.addEventListener("pointermove", onPointerMove)
    canvas.addEventListener("pointerup", onPointerUp)
    canvas.addEventListener("pointercancel", onPointerUp)

    return () => {
      cancelAnimationFrame(frame)
      canvas.removeEventListener("pointerdown", onPointerDown)
      canvas.removeEventListener("pointermove", onPointerMove)
      canvas.removeEventListener("pointerup", onPointerUp)
      canvas.removeEventListener("pointercancel", onPointerUp)
      globe.destroy()
    }
  }, [])

  return canvasRef
}
