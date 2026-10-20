"use client"

import { updateResourceSchema } from "@repo/shared/schemas/resources"
import type { ReactNode } from "react"
import { updateResource } from "../../actions/updateResource"
import { ResourceEdit } from "./resourceEditFields"

/** The editor wired to one resource. Who may save is checked by updateResource, on the server. */
export const ResourceEditProvider = ({
  children,
  resourceId,
}: {
  children: ReactNode
  resourceId: number
}) => (
  <ResourceEdit.Provider
    onSave={(values) => updateResource(resourceId, values)}
    schema={updateResourceSchema}
  >
    {children}
  </ResourceEdit.Provider>
)
