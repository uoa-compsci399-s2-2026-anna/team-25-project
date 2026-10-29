"use client"

import { ItemActionsMenu } from "@repo/ui/components/composite"
import { toast } from "@repo/ui/components/ui"
import { useRouter } from "next/navigation"
import * as React from "react"
import { deletePublication } from "../actions/deletePublication"
import type { FormValues } from "./AddPublicationForm"
import { EditPublicationDialog } from "./EditPublicationDialog"

const DELETE_FAILED = "Could not delete this publication. Try again."

export interface PublicationCardActionsProps {
  publicationId: number
  title: string
  initialValues: FormValues
}

/**
 * The publication card's Edit/Delete dropdown. Only rendered for the
 * publication's linked authors (see `PublicationCardActionsServer`).
 */
export function PublicationCardActions({
  publicationId,
  title,
  initialValues,
}: PublicationCardActionsProps) {
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
            const result = await deletePublication(publicationId)
            if (!result.ok) {
              toast.add({ description: result.formError ?? DELETE_FAILED, title: "Delete failed" })
              return
            }
            toast.add({ description: `"${title}" was deleted.`, title: "Publication deleted" })
            router.refresh()
          } catch (error) {
            console.error("deletePublication failed", error)
            toast.add({ description: DELETE_FAILED, title: "Delete failed" })
          }
        }}
        onEdit={() => {
          setEditKey((key) => key + 1)
          setEditOpen(true)
        }}
      />
      <EditPublicationDialog
        initialValues={initialValues}
        key={editKey}
        onOpenChange={setEditOpen}
        onSaved={() => router.refresh()}
        open={editOpen}
        publicationId={publicationId}
      />
    </>
  )
}
