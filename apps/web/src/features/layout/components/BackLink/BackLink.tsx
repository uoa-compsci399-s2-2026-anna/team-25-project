import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type * as React from "react"
import type { AppRoute } from "@/lib/routes"

export interface BackLinkProps {
  /** Where back goes. A fixed destination, so a deep link with no history still works. */
  href: AppRoute
  children: React.ReactNode
}

/** Owns its own row padding, so the link sits at the same height on every detail page. */
export function BackLink({ href, children }: BackLinkProps) {
  return (
    <div className="px-10 pt-10 md:px-12">
      <Link
        className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
        href={href}
      >
        <ArrowLeft aria-hidden className="size-4" />
        {children}
      </Link>
    </div>
  )
}
