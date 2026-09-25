import { cn } from "@repo/ui/lib/utils"
import type * as React from "react"

/** Caps page content at the site's max width. Put full-bleed backgrounds outside it. */
export function PageContainer({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1512px]", className)} {...props} />
}
