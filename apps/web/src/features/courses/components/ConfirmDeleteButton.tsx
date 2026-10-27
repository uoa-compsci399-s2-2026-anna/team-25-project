"use client"

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  toast,
} from "@repo/ui/components/ui"
import type { Route } from "next"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { ActionResult } from "@/features/auth/actions/types"

export interface ConfirmDeleteButtonProps {
  /** The trigger's text, e.g. "Delete course". */
  label: string
  /** Named in the confirm dialog's title, e.g. "SE 101". */
  itemName: string
  /** What the delete takes with it, for the confirm dialog. */
  description: string
  onDelete: () => Promise<ActionResult>
  /** Shown once the delete succeeds. */
  deleted: { title: string; description: string }
  /**
   * Where to go after the delete, as the page showing the item no longer can.
   * `typedRoutes` rejects a built course route as `Route` here, hence the cast below.
   */
  deletedHref: string
  /** Shown when the delete fails without a message of its own. */
  failureMessage: string
}

/**
 * A course page delete: a button that asks to confirm first, then deletes and moves on.
 * Shared by "Delete course" and "Delete offering".
 */
export function ConfirmDeleteButton({
  label,
  itemName,
  description,
  onDelete,
  deleted,
  deletedHref,
  failureMessage,
}: ConfirmDeleteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      const result = await onDelete()
      if (!result.ok) {
        toast.add({ description: result.formError ?? failureMessage, title: "Delete failed" })
        return
      }
      setOpen(false)
      toast.add(deleted)
      router.push(deletedHref as Route)
    } catch (error) {
      console.error(`${label} failed`, error)
      toast.add({ description: failureMessage, title: "Delete failed" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    // Kept open while deleting, so a slow delete can't be dismissed half way.
    <Dialog onOpenChange={(next) => !deleting && setOpen(next)} open={open}>
      <DialogTrigger
        render={
          <Button
            className="font-bold"
            size="sm"
            type="button"
            variant="button-destructive-outline"
          />
        }
      >
        {label}
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogTitle>Delete {itemName}?</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <DialogFooter>
          <Button
            disabled={deleting}
            onClick={() => setOpen(false)}
            type="button"
            variant="button-transparent"
          >
            Keep
          </Button>
          <Button
            disabled={deleting}
            onClick={confirmDelete}
            type="button"
            variant="button-destructive"
          >
            {deleting ? "Deleting..." : "Confirm delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
