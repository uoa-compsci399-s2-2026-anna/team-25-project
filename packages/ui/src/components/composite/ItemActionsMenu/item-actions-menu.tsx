"use client"

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui"
import { EllipsisVerticalIcon } from "lucide-react"
import * as React from "react"

export interface ItemActionsMenuProps {
  /**
   * Named in the kebab trigger's aria-label, e.g. "CS399" - so a screen reader
   * can tell one row's menu apart from another's.
   */
  itemLabel: string
  onEdit: () => void
  /** Omitted to hide Delete entirely - e.g. an editor who may edit a draft but not delete it. */
  onDelete?: () => void
  /** Defaults to a generic confirmation. */
  deleteConfirmMessage?: string
}

/**
 * A vertical kebab trigger with "Edit" and "Delete" - entity-agnostic, driven
 * entirely by `onEdit`/`onDelete`. Delete swaps the menu's content for an inline
 * confirm step rather than calling its handler straight away, matching
 * `AddCapstoneCourseDialog`'s own "Delete draft" confirm.
 */
export function ItemActionsMenu({
  itemLabel,
  onEdit,
  onDelete,
  deleteConfirmMessage = "Delete this? This can't be undone.",
}: ItemActionsMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)

  // Reset on open, not on close: the popup keeps rendering its last content
  // while it plays its close animation, so clearing `confirming` at the same
  // time as closing would swap it back to Edit/Delete mid-fade-out, flashing
  // the wrong content. Resetting on the next open is invisible either way,
  // and still guarantees a reopen never starts back on a stale confirm.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) setConfirming(false)
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange} open={open}>
      <DropdownMenuTrigger
        aria-label={`Actions for ${itemLabel}`}
        render={<Button size="icon-sm" type="button" variant="button-transparent" />}
      >
        <EllipsisVerticalIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {confirming ? (
          <div className="flex flex-col gap-2 p-2">
            <p className="text-sm">{deleteConfirmMessage}</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                onClick={() => setConfirming(false)}
                size="sm"
                type="button"
                variant="button-transparent"
              >
                Keep
              </Button>
              <Button
                onClick={() => {
                  // Leaves `confirming` as-is - see handleOpenChange.
                  setOpen(false)
                  onDelete?.()
                }}
                size="sm"
                type="button"
                variant="button-destructive"
              >
                Confirm delete
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            {onDelete && (
              <DropdownMenuItem
                closeOnClick={false}
                onClick={() => setConfirming(true)}
                variant="destructive"
              >
                Delete
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
