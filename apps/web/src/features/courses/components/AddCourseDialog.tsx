"use client"

import { CourseDeliveryFormat, CourseDeliveryFormatLabels } from "@repo/shared/enums/courses"
import {
  AddCapstoneCourseDialog,
  type AddCapstoneCourseDialogValues,
} from "@repo/ui/components/composite"
import { Button, toast } from "@repo/ui/components/ui"
import type { ComponentProps } from "react"
import { useState } from "react"
import { createCourse } from "../actions/createCourse"
import { updateDraftCourse } from "../actions/updateDraftCourse"
import type { EditableDraftCourse } from "../courses.format"
import { useCourseForm } from "./useCourseForm"

const baseValues: AddCapstoneCourseDialogValues = {
  additionalInfo: null,
  assessments: null,
  code: "",
  deliveryFormat: "",
  endDate: "",
  learningOutcomes: null,
  name: "",
  period: "",
  programme: "",
  projectType: "",
  role: "",
  startDate: "",
}

const deliveryFormatOptions = Object.values(CourseDeliveryFormat).map((value) => ({
  label: CourseDeliveryFormatLabels[value],
  value,
}))

export interface AddCourseDialogProps {
  /**
   * Pre-fills "Your role" from the signed-in member's profile position - still
   * editable. A promise rather than a value so the server can stream it in
   * without this dialog having to wait for it: the trigger is usable at once,
   * and the role lands in the field whenever it arrives.
   */
  defaultRole: Promise<string>
}

/**
 * The button that opens the dialog - also what stands in for it before it has
 * loaded. `DialogTrigger` clones its own click handling and a ref onto
 * whatever element is passed as its `trigger`, so every prop here has to
 * reach the real `<Button>` underneath rather than being swallowed by this
 * wrapper.
 */
export function AddCourseTriggerButton(props: ComponentProps<typeof Button>) {
  return (
    <Button className="font-bold" size="lg" type="button" variant="button-mauve" {...props}>
      + Add your course
    </Button>
  )
}

export function AddCourseDialog({ defaultRole }: AddCourseDialogProps) {
  const [open, setOpen] = useState(false)
  const form = useCourseForm({
    failureMessage: "Could not add this course. Try again.",
    initialValues: baseValues,
    onSaved: (values, intent) => {
      toast.add({
        description:
          intent === "publish"
            ? `${values.code} is now published.`
            : `${values.code} was saved as a draft.`,
        title: "Course added",
      })
      setOpen(false)
    },
    save: (values, intent) => createCourse({ ...values, intent }),
  })

  // Reopening always starts from a clean form - continuing a saved draft is
  // `EditDraftCourseDialog`'s job, opened from the draft's row in the table.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) return

    form.reset(baseValues)
    // Seed "Your role" from the profile once that's known - but only into a
    // still-blank field, so a role the user has already typed while it was on
    // its way is never overwritten. A failed lookup just leaves it blank.
    void defaultRole.then(
      (role) => form.setValues((current) => (current.role ? current : { ...current, role })),
      () => undefined,
    )
  }

  return (
    <AddCapstoneCourseDialog
      {...form.dialogProps}
      deliveryFormatOptions={deliveryFormatOptions}
      onOpenChange={handleOpenChange}
      open={open}
      trigger={<AddCourseTriggerButton />}
    />
  )
}

export interface EditDraftCourseDialogProps {
  draft: EditableDraftCourse
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The add-course dialog reopened over a saved draft, pre-filled with what it
 * holds. Saving updates that same course and offering rather than creating a
 * new draft, and publishing publishes it.
 *
 * Its values seed once, on mount - the rich-text editors only read theirs then -
 * so the caller remounts it (a fresh `key`) each time a draft is opened.
 */
export function EditDraftCourseDialog({ draft, open, onOpenChange }: EditDraftCourseDialogProps) {
  const form = useCourseForm({
    failureMessage: "Could not save this course. Try again.",
    initialValues: draft.values,
    onSaved: (values, intent) => {
      toast.add(
        intent === "publish"
          ? { description: `${values.code} is now published.`, title: "Course published" }
          : { description: `${values.code} was saved.`, title: "Draft updated" },
      )
      onOpenChange(false)
    },
    save: (values, intent) =>
      updateDraftCourse({
        ...values,
        courseId: draft.courseId,
        intent,
        versionId: draft.versionId,
      }),
  })

  return (
    <AddCapstoneCourseDialog
      {...form.dialogProps}
      deliveryFormatOptions={deliveryFormatOptions}
      onOpenChange={onOpenChange}
      open={open}
      title="Edit draft course"
    />
  )
}
