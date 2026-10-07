"use client"

import { Button, CollapsibleTrigger } from "@repo/ui/components/ui"
import { ChevronDownIcon } from "lucide-react"
import type { ReactNode } from "react"

/** The toggle for a collapsible section of the add publication form. */
export const SectionTrigger = ({ children }: { children: ReactNode }) => (
  <CollapsibleTrigger
    render={<Button className="group gap-2" size="sm" variant="button-transparent" />}
  >
    {children}
    <ChevronDownIcon
      aria-hidden="true"
      className="size-4 transition-transform group-data-panel-open:rotate-180"
    />
  </CollapsibleTrigger>
)
