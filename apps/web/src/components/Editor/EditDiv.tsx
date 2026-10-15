"use client"

import type { ReactNode } from "react"
import { EditSwitch } from "./EditField"
export const EditDiv = ({
  children,
  className,
  view,
}: {
  children: ReactNode
  className?: string
  view?: ReactNode
}) => (
  <EditSwitch view={view}>
    <div className={className}>{children}</div>
  </EditSwitch>
)
