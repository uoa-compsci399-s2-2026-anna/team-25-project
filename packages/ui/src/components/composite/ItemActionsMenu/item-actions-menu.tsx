"use client"

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
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
 * entirely by `onEdit`/`onDelete`. Delete closes the menu and opens a proper
 * confirm Dialog rather than calling its handler straight away.
 */
export function ItemActionsMenu({
  itemLabel,
  onEdit,
  onDelete,
  deleteConfirmMessage = "This can't be undone.",
}: ItemActionsMenuProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${itemLabel}`}
          render={<Button size="icon-sm" type="button" variant="button-transparent" />}
        >
          <EllipsisVerticalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
          {onDelete && (
            <DropdownMenuItem onClick={() => setConfirmOpen(true)} variant="destructive">
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {onDelete && (
        <Dialog onOpenChange={setConfirmOpen} open={confirmOpen}>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Delete {itemLabel}?</DialogTitle>
            <DialogDescription>{deleteConfirmMessage}</DialogDescription>
            <DialogFooter>
              <Button
                onClick={() => setConfirmOpen(false)}
                type="button"
                variant="button-transparent"
              >
                Keep
              </Button>
              <Button
                onClick={() => {
                  setConfirmOpen(false)
                  onDelete()
                }}
                type="button"
                variant="button-destructive"
              >
                Confirm delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
