"use client"

import { ItemActionsMenu, type SavedAttachment } from "@repo/ui/components/composite"
import { useRouter } from "next/navigation"
import * as React from "react"
import type { ResourceCourseOption } from "../resources.queries"
import type { ResourceFormValues } from "./AddResourceForm"
import { EditResourceDialog } from "./EditResourceDialog"

export interface ResourceCardActionsProps {
  resourceId: number
  title: string
  initialValues: ResourceFormValues
  savedAttachments: SavedAttachment[]
  courses: ResourceCourseOption[]
}

/**
 * The resource card's Edit dropdown. Only rendered for the resource's
 * owner and admins (see `ResourceCardActionsServer`).
 */
export function ResourceCardActions({
  resourceId,
  title,
  initialValues,
  savedAttachments,
  courses,
}: ResourceCardActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  // Remounts the dialog on every open, so a cancelled edit never lingers into the next one.
  const [editKey, setEditKey] = React.useState(0)

  return (
    <>
      <ItemActionsMenu
        itemLabel={title}
        onEdit={() => {
          setEditKey((key) => key + 1)
          setEditOpen(true)
        }}
      />
      <EditResourceDialog
        courses={courses}
        initialValues={initialValues}
        key={editKey}
        onOpenChange={setEditOpen}
        onSaved={() => router.refresh()}
        open={editOpen}
        resourceId={resourceId}
        savedAttachments={savedAttachments}
      />
    </>
  )
}
