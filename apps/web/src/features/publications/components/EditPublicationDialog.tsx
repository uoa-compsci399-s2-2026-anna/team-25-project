"use client"

import { Button, Dialog, DialogClose, DialogContent, DialogTitle } from "@repo/ui/components/ui"
import { updatePublication } from "../actions/updatePublication"
import { AddPublicationForm, type FormValues } from "./AddPublicationForm"

type EditPublicationDialogProps = {
  publicationId: number
  initialValues: FormValues
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful save, once the dialog has closed. */
  onSaved?: () => void
}

export const EditPublicationDialog = ({
  publicationId,
  initialValues,
  open,
  onOpenChange,
  onSaved,
}: EditPublicationDialogProps) => (
  <Dialog onOpenChange={onOpenChange} open={open}>
    <DialogContent
      className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-3xl"
      showCloseButton={false}
    >
      <div className="flex items-start justify-between gap-4">
        <DialogTitle className="font-bold text-2xl">Edit publication</DialogTitle>
        <DialogClose render={<Button size="sm" variant="button-transparent" />}>Cancel</DialogClose>
      </div>
      <AddPublicationForm
        initialValues={initialValues}
        mode="edit"
        onSave={(values) => updatePublication(publicationId, values)}
        onSuccess={() => {
          onOpenChange(false)
          onSaved?.()
        }}
      />
    </DialogContent>
  </Dialog>
)
