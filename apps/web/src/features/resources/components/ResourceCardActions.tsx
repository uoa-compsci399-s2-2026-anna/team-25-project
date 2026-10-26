"use client"

import { ItemActionsMenu, type SavedAttachment } from "@repo/ui/components/composite"
import { toast } from "@repo/ui/components/ui"
import { useRouter } from "next/navigation"
import * as React from "react"
import { deleteResource } from "../actions/deleteResource"
import type { ResourceCourseOption } from "../resources.queries"
import type { ResourceFormValues } from "./AddResourceForm"
import { EditResourceDialog } from "./EditResourceDialog"

const DELETE_FAILED = "Could not delete this resource. Try again."

export interface ResourceCardActionsProps {
  resourceId: number
  title: string
  initialValues: ResourceFormValues
  savedAttachments: SavedAttachment[]
  courses: ResourceCourseOption[]
}

/**
 * The resource card's Edit/Delete dropdown. Only rendered for the resource's
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
        deleteConfirmMessage="This can't be undone."
        itemLabel={title}
        onDelete={async () => {
          try {
            const result = await deleteResource(resourceId)
            if (!result.ok) {
              toast.add({ description: result.formError ?? DELETE_FAILED, title: "Delete failed" })
              return
            }
            toast.add({ description: `"${title}" was deleted.`, title: "Resource deleted" })
            router.refresh()
          } catch (error) {
            console.error("deleteResource failed", error)
            toast.add({ description: DELETE_FAILED, title: "Delete failed" })
          }
        }}
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
