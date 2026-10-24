"use client"

import { CourseDeliveryFormat, CourseDeliveryFormatLabels } from "@repo/shared/enums/courses"
import {
  AddCapstoneCourseDialog,
  type AddCapstoneCourseDialogValues,
} from "@repo/ui/components/composite"
import { Button, toast } from "@repo/ui/components/ui"
import { useState } from "react"
import { createOffering } from "../actions/createOffering"
import { updateOffering } from "../actions/updateOffering"
import { useCourseForm } from "./useCourseForm"

const deliveryFormatOptions = Object.values(CourseDeliveryFormat).map((value) => ({
  label: CourseDeliveryFormatLabels[value],
  value,
}))

export interface AddOfferingDialogProps {
  courseId: number
  /** The offering the dialog is filled in from, whose teaching team the new one keeps. */
  sourceId: number
  initialValues: AddCapstoneCourseDialogValues
}

export function AddOfferingDialog({ courseId, sourceId, initialValues }: AddOfferingDialogProps) {
  const [open, setOpen] = useState(false)
  const form = useCourseForm({
    failureMessage: "Could not add this offering. Try again.",
    initialValues,
    onSaved: (values) => {
      toast.add({ description: `${values.period} is now published.`, title: "Offering added" })
      setOpen(false)
    },
    save: (values) => createOffering({ ...values, courseId, sourceId }),
  })

  // Reopening always starts again from the current offering.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) form.reset(initialValues)
  }

  return (
    <AddCapstoneCourseDialog
      {...form.dialogProps}
      deliveryFormatOptions={deliveryFormatOptions}
      kind="offering"
      onOpenChange={handleOpenChange}
      // Publish only: a saved draft would have nowhere to show up yet.
      onSaveDraft={undefined}
      open={open}
      trigger={
        <Button className="font-bold" size="sm" type="button" variant="button-mauve">
          + Add offering
        </Button>
      }
    />
  )
}

export interface EditOfferingDialogProps {
  courseId: number
  offeringId: number
  initialValues: AddCapstoneCourseDialogValues
}

/** Corrects a published offering in place. Saving puts the change live at once. */
export function EditOfferingDialog({
  courseId,
  offeringId,
  initialValues,
}: EditOfferingDialogProps) {
  const [open, setOpen] = useState(false)
  const form = useCourseForm({
    failureMessage: "Could not save this offering. Try again.",
    initialValues,
    onSaved: (values) => {
      toast.add({ description: `${values.period} was updated.`, title: "Offering updated" })
      setOpen(false)
    },
    save: (values) => updateOffering({ ...values, courseId, offeringId }),
  })

  // Reopening starts again from the offering as it's saved, dropping unsaved edits.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) form.reset(initialValues)
  }

  return (
    <AddCapstoneCourseDialog
      {...form.dialogProps}
      deliveryFormatOptions={deliveryFormatOptions}
      kind="correction"
      onOpenChange={handleOpenChange}
      // A published offering has no draft to save.
      onSaveDraft={undefined}
      open={open}
      trigger={
        <Button
          borderColor="charcoal"
          className="font-bold"
          size="sm"
          type="button"
          variant="button-transparent"
        >
          Edit offering
        </Button>
      }
    />
  )
}
