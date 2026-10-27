"use client"

import { ItemActionsMenu } from "@repo/ui/components/composite"
import { Button, toast } from "@repo/ui/components/ui"
import { useStore } from "@tanstack/react-form"
import { useRouter } from "next/navigation"
import { useEdit } from "@/components/Editor/EditContext"
import { Routes } from "@/lib/routes"
import { deleteResource } from "../actions/deleteResource"

const DELETE_FAILED = "Could not delete this resource. Try again."

export interface ResourceTitleActionsProps {
  resourceId: number
  title: string
}

/**
 * The title row's Edit/Delete dropdown, next to the heading on the resource's
 * own page - the only entry point into editing, so while editing this swaps
 * to Cancel/Done instead (matching the old ResourceEditButton it replaced).
 */
export function ResourceTitleActions({ resourceId, title }: ResourceTitleActionsProps) {
  const router = useRouter()
  const { cancel, error, form, isEditing, startEditing } = useEdit()
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  if (isEditing) {
    return (
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex gap-2">
          <Button disabled={isSubmitting} onClick={cancel} variant="button-transparent">
            Cancel
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={() => form.handleSubmit()}
            variant="button-mauve"
          >
            {isSubmitting ? "Saving..." : "Done"}
          </Button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    )
  }

  return (
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
          router.push(Routes.RESOURCES.ROOT)
        } catch (deleteError) {
          console.error("deleteResource failed", deleteError)
          toast.add({ description: DELETE_FAILED, title: "Delete failed" })
        }
      }}
      onEdit={startEditing}
    />
  )
}
