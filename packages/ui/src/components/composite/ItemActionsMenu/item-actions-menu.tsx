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
  onDelete: () => void
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

  // Closing any other way (outside click, Escape) also drops a pending confirm,
  // so reopening never starts back on it.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) setConfirming(false)
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
                  setOpen(false)
                  setConfirming(false)
                  onDelete()
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
            <DropdownMenuItem
              closeOnClick={false}
              onClick={() => setConfirming(true)}
              variant="destructive"
            >
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
