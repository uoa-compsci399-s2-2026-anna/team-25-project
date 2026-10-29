"use client"

import { ManageEditorsDialog, type MemberOption } from "@repo/ui/components/composite"
import { Button, toast } from "@repo/ui/components/ui"
import { useState } from "react"
import { searchMembers } from "../actions/searchMembers"
import { updateCourseEditors } from "../actions/updateCourseEditors"

const FAILURE_MESSAGE = "Could not save the editors. Try again."

export interface ManageEditorsButtonProps {
  courseId: number
  owner: MemberOption
  editors: MemberOption[]
}

export function ManageEditorsButton({ courseId, owner, editors }: ManageEditorsButtonProps) {
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState(editors)
  const [saving, setSaving] = useState<"editors" | "transfer" | undefined>(undefined)
  const [formError, setFormError] = useState<string | undefined>(undefined)

  // Reopening starts again from the saved editors, dropping unsaved changes.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setChosen(editors)
      setFormError(undefined)
    }
  }

  const save = async (list: MemberOption[], newOwner?: MemberOption) => {
    setSaving(newOwner ? "transfer" : "editors")
    setFormError(undefined)
    try {
      const result = await updateCourseEditors({
        courseId,
        editorIds: list.map((editor) => editor.id),
        ownerId: newOwner?.id,
      })
      if (result.ok) {
        toast.add(
          newOwner
            ? {
                description: `${newOwner.firstName} ${newOwner.lastName} now owns this course. You're still an editor.`,
                title: "Ownership transferred",
              }
            : { description: "The course's editors were updated.", title: "Editors saved" },
        )
        setOpen(false)
      } else {
        setFormError(result.formError ?? FAILURE_MESSAGE)
      }
    } catch {
      setFormError(FAILURE_MESSAGE)
    } finally {
      setSaving(undefined)
    }
  }

  return (
    <ManageEditorsDialog
      editors={chosen}
      formError={formError}
      onEditorsChange={setChosen}
      onOpenChange={handleOpenChange}
      onSave={() => void save(chosen)}
      onSearch={searchMembers}
      // The dialog offers a transfer only when the list has no unsaved changes.
      onTransfer={(editor) => void save(editors, editor)}
      open={open}
      owner={owner}
      saving={saving}
      transferableIds={editors.map((editor) => editor.id)}
      trigger={
        <Button
          borderColor="charcoal"
          className="self-start font-bold"
          size="sm"
          type="button"
          variant="button-transparent"
        >
          Manage editors
        </Button>
      }
    />
  )
}
