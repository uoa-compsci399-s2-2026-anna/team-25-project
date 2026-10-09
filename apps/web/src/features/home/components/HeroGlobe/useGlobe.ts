import createGlobe from "cobe"
import { useEffect, useRef } from "react"
import type { GlobeMarker } from "../../globe.queries"

const DRAG_SPEED = 0.005
// How far up or down the globe can tilt, in radians (about 70°), so it can't flip over a pole.
const MAX_TILT = 1.2

export const useGlobe = (markers: GlobeMarker[]) => {
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
      markerElevation: 0.02,
      glowColor: [1, 1, 1],
      markers: markers.map((marker) => ({
        id: marker.id,
        location: marker.location,
        size: 0.03,
      })),
    })

    let frame = 0
    const start = performance.now()
    function redraw() {
      globe.update({})
      // biome-ignore lint/nursery/useReactCompiler: false positive - redraw is local to the effect and only schedules itself
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
  }, [markers])

  return canvasRef
}
