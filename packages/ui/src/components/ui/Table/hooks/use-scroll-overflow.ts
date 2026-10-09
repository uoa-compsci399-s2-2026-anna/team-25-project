"use client"

import { type RefObject, useEffect, useState } from "react"

interface ScrollOverflow {
  /** Content is hidden past the left edge. */
  start: boolean
  /** Content is hidden past the right edge. */
  end: boolean
}

// Zoomed or scaled layouts can leave `scrollLeft` a fraction short of the end.
const TOLERANCE = 1

/**
 * Tracks whether a horizontally scrolling element has content hidden on either
 * side, so it can hint that there is more to scroll to.
 */
function useScrollOverflow(ref: RefObject<HTMLElement | null>): ScrollOverflow {
  const [overflow, setOverflow] = useState<ScrollOverflow>({ end: false, start: false })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const measure = () => {
      const { clientWidth, scrollLeft, scrollWidth } = element
      const start = scrollLeft > TOLERANCE
      const end = scrollLeft + clientWidth < scrollWidth - TOLERANCE
      // Same values bail out of the re-render, so scrolling mid-way stays cheap.
      setOverflow((previous) =>
        previous.start === start && previous.end === end ? previous : { end, start },
      )
    }
    measure()

    element.addEventListener("scroll", measure, { passive: true })
    const stopListening = () => element.removeEventListener("scroll", measure)

    // The element resizes with the viewport, and its content resizes as rows
    // are filtered in and out, so watch both.
    if (typeof ResizeObserver === "undefined") return stopListening
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    if (element.firstElementChild) observer.observe(element.firstElementChild)

    return () => {
      stopListening()
      observer.disconnect()
    }
  }, [ref])

  return overflow
}

export { type ScrollOverflow, useScrollOverflow }
