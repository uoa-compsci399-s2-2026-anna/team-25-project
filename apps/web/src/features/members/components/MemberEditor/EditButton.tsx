"use client"

import { Button } from "@repo/ui/components/ui"
import { useStore } from "@tanstack/react-form"
import { useEdit } from "./EditContext"

/** Starts edit mode for the whole page, then saves (Done) or discards (Cancel) every field. */
export const EditButton = () => {
  const { cancel, error, form, isEditing, startEditing } = useEdit()
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <div className="flex max-w-xs flex-col items-end gap-1">
      {isEditing ? (
        <div className="flex gap-2">
          <Button disabled={isSubmitting} onClick={cancel} variant="button-transparent">
            Cancel
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={() => form.handleSubmit()}
            variant="button-mauve"
          >
            {isSubmitting ? "Saving..." : "Done"}
          </Button>
        </div>
      ) : (
        <Button onClick={startEditing} variant="button-mauve">
          Edit
        </Button>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}
