"use client"

import { ItemActionsMenu } from "@repo/ui/components/composite"
import { toast } from "@repo/ui/components/ui"
import type { Route } from "next"
import { useRouter } from "next/navigation"
import { deleteResource } from "../actions/deleteResource"

const DELETE_FAILED = "Could not delete this resource. Try again."

export interface ResourceCardActionsProps {
  resourceId: number
  title: string
  /**
   * Where Edit sends the viewer - the resource's page, with its editor open.
   * `typedRoutes` rejects a plain `string` prop type here since the hash this
   * is built with isn't a route Next can see statically, hence the cast below.
   */
  editHref: string
}

/**
 * A resource card's Edit/Delete dropdown. Only rendered for the resource's
 * owner - admins manage resources from the admin dashboard instead.
 */
export function ResourceCardActions({ resourceId, title, editHref }: ResourceCardActionsProps) {
  const router = useRouter()

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
          router.refresh()
        } catch (error) {
          console.error("deleteResource failed", error)
          toast.add({ description: DELETE_FAILED, title: "Delete failed" })
        }
      }}
      onEdit={() => router.push(editHref as Route)}
    />
  )
}
