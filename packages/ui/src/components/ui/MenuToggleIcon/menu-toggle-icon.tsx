import { cn } from "@repo/ui/lib/utils"
import type * as React from "react"

interface MenuToggleIconProps extends React.ComponentProps<"span"> {
  /** Shows an X when true, a hamburger when false. */
  open: boolean
}

// Outer bars sit 1.75 (7px) from the middle, so translating by that stacks them before rotating.
const bar =
  "absolute left-0 h-0.5 w-full rounded-full bg-current transition duration-300 ease-in-out motion-reduce:transition-none"

/** Decorative - the wrapping button provides the accessible name. */
function MenuToggleIcon({ className, open, ...props }: MenuToggleIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative block size-6", className)}
      data-slot="menu-toggle-icon"
      data-state={open ? "open" : "closed"}
      {...props}
    >
      <span className={cn(bar, "top-1/2 -mt-2", open && "translate-y-1.75 rotate-45")} />
      <span className={cn(bar, "top-1/2 -mt-px", open && "scale-x-0 opacity-0")} />
      <span className={cn(bar, "top-1/2 mt-1.5", open && "-translate-y-1.75 -rotate-45")} />
    </span>
  )
}

export type { MenuToggleIconProps }
export { MenuToggleIcon }
