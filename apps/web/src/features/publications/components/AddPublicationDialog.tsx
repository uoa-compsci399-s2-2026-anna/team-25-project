"use client"

import type { PersonName } from "@repo/shared/utils/bibtex-import"
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui"
import { useState } from "react"
import { AddPublicationForm } from "./AddPublicationForm"

type AddPublicationDialogProps = {
  /** The signed-in member, filled in as the first author. */
  currentUser: PersonName
}

export const AddPublicationDialog = ({ currentUser }: AddPublicationDialogProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button className="font-bold" size="lg" variant="button-mauve">
            + Add a publication
          </Button>
        }
      />
      <DialogContent
        className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-3xl"
        showCloseButton={false}
      >
        <div className="flex items-start justify-between gap-4">
          <DialogTitle className="font-bold text-2xl">Add a publication</DialogTitle>
          <DialogClose render={<Button size="sm" variant="button-transparent" />}>
            Cancel
          </DialogClose>
        </div>
        <AddPublicationForm currentUser={currentUser} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
