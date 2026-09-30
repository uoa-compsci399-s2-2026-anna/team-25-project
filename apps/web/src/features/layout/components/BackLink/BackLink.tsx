import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type * as React from "react"
import type { AppRoute } from "@/lib/routes"

export interface BackLinkProps {
  /** Where back goes. A fixed destination, so a deep link with no history still works. */
  href: AppRoute
  children: React.ReactNode
}

export function BackLink({ href, children }: BackLinkProps) {
  return (
    <Link
      className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
      href={href}
    >
      <ArrowLeft aria-hidden className="size-4" />
      {children}
    </Link>
  )
}
