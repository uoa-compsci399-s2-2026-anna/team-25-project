"use client"

import type { SavedAttachment } from "@repo/ui/components/composite"
import { Button, Dialog, DialogClose, DialogContent, DialogTitle } from "@repo/ui/components/ui"
import { updateResource } from "../actions/updateResource"
import type { ResourceCourseOption } from "../resources.queries"
import { AddResourceForm, type ResourceFormValues } from "./AddResourceForm"

type EditResourceDialogProps = {
  resourceId: number
  initialValues: ResourceFormValues
  savedAttachments: SavedAttachment[]
  courses: ResourceCourseOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful save, once the dialog has closed. */
  onSaved?: () => void
}

export const EditResourceDialog = ({
  resourceId,
  initialValues,
  savedAttachments,
  courses,
  open,
  onOpenChange,
  onSaved,
}: EditResourceDialogProps) => (
  <Dialog onOpenChange={onOpenChange} open={open}>
    <DialogContent
      className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-3xl"
      showCloseButton={false}
    >
      <div className="flex items-start justify-between gap-4">
        <DialogTitle className="font-bold text-2xl">Edit resource</DialogTitle>
        <DialogClose render={<Button size="sm" variant="button-transparent" />}>Cancel</DialogClose>
      </div>
      <AddResourceForm
        courses={courses}
        initialValues={initialValues}
        mode="edit"
        onSave={(formData) => updateResource(resourceId, formData)}
        onSuccess={() => {
          onOpenChange(false)
          onSaved?.()
        }}
        savedAttachments={savedAttachments}
      />
    </DialogContent>
  </Dialog>
)
