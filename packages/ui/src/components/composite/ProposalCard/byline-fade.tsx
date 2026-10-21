"use client"

import { cn } from "@repo/ui/lib/utils"
import type * as React from "react"
import { useEffect, useRef, useState } from "react"

// Matches the 3rem fade in the mask below.
const FADE_WIDTH = 48

/**
 * Clips to one line and, only once the text actually overflows, fades the last 3rem to
 * nothing so a long byline trails off instead of wrapping. Links under the fade are taken
 * out of the tab order, so keyboard focus can't land on one that can't be seen.
 */
function BylineFade({ className, ...props }: React.ComponentProps<"p">) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const measure = () => {
      const overflowing = element.scrollWidth > element.clientWidth
      setOverflows(overflowing)
      const fadeStart = element.getBoundingClientRect().right - FADE_WIDTH
      // The links are rendered by the server-side card, so the DOM is the only place to reach them.
      for (const link of element.querySelectorAll("a")) {
        if (overflowing && link.getBoundingClientRect().right > fadeStart) link.tabIndex = -1
        else link.removeAttribute("tabindex")
      }
    }
    measure()

    // A narrower card can push the byline into the fade, or a wider one pull it back out.
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <p
      className={cn(
        "overflow-hidden whitespace-nowrap",
        overflows && "[mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
}

export { BylineFade }
