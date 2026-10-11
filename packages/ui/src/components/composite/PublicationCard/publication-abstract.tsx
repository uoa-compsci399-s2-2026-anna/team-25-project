"use client"

import { CardDescription } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { useEffect, useId, useRef, useState } from "react"

/**
 * Clamps a long abstract to three lines, with a toggle to read the rest.
 * The toggle only shows once the text actually overflows the clamp.
 */
function PublicationAbstract({ children }: { children: string }) {
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    const element = ref.current
    // Expanded text never overflows, so measuring then would hide the toggle
    // that collapses it again.
    if (!element || expanded) return

    const measure = () => setOverflows(element.scrollHeight > element.clientHeight)
    measure()

    // Rewrapping on resize can push the text past the clamp or pull it back in.
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [expanded])

  return (
    <div className="flex flex-col items-start gap-1">
      <CardDescription className={cn(!expanded && "line-clamp-3")} id={id} ref={ref}>
        {children}
      </CardDescription>
      {overflows && (
        <button
          aria-controls={id}
          aria-expanded={expanded}
          className="self-end font-medium text-brand-slate text-xs underline-offset-4 hover:underline"
          onClick={() => setExpanded((open) => !open)}
          type="button"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

export { PublicationAbstract }
