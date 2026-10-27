"use client"

import * as React from "react"
import { Button } from "../../ui/Button/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "../../ui/Dialog/dialog"
import { FieldError } from "../../ui/Field/field"
import {
  MemberLabel,
  type MemberOption,
  MemberPicker,
  type MemberSearch,
  memberName,
} from "../MemberPicker/member-picker"

export type ManageEditorsDialogProps = {
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The course's owner, who is always an editor and cannot be removed. */
  owner: MemberOption
  editors: MemberOption[]
  onEditorsChange: (editors: MemberOption[]) => void
  onSearch: MemberSearch
  onSave: () => void
  /**
   * Shows "Make owner" on each saved editor (the ones in `transferableIds`). The dialog
   * asks to confirm before calling this.
   */
  onTransfer?: (editor: MemberOption) => void
  /** Editors already saved on the course - only they can take ownership. */
  transferableIds?: readonly number[]
  /** Which action is in flight, so only that button shows a loading label. */
  saving?: "editors" | "transfer"
  formError?: string
}

/**
 * Presentational only - the caller owns the editor list and saves it, so this can
 * be driven from a story as easily as from the real action.
 */
export function ManageEditorsDialog({
  trigger,
  open,
  onOpenChange,
  owner,
  editors,
  onEditorsChange,
  onSearch,
  onSave,
  onTransfer,
  transferableIds = [],
  saving,
  formError,
}: ManageEditorsDialogProps) {
  const pickerId = React.useId()
  const chosen = React.useMemo(
    () => [owner.id, ...editors.map((editor) => editor.id)],
    [owner.id, editors],
  )
  const [confirming, setConfirming] = React.useState<MemberOption | null>(null)
  const busy = Boolean(saving)

  // Closing backs out of a pending transfer.
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setConfirming(null)
    onOpenChange?.(nextOpen)
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="flex flex-col gap-4 sm:max-w-lg">
        <div className="flex flex-col gap-1">
          <DialogTitle className="font-bold text-2xl">Course editors</DialogTitle>
          <DialogDescription>
            Editors can change the course and all its offerings. Only you can change the course's
            editors.
          </DialogDescription>
        </div>

        <MemberPicker
          disabled={busy}
          exclude={chosen}
          id={pickerId}
          label="Add an editor"
          onSearch={onSearch}
          onSelect={(member) => onEditorsChange([...editors, member])}
          placeholder="Search members to add"
        />

        <ul aria-label="Editors" className="flex flex-col gap-2">
          <li className="flex items-center justify-between gap-3 rounded-lg border px-2 py-1.5">
            <MemberLabel member={owner} />
            <span className="shrink-0 text-muted-foreground text-xs">Owner</span>
          </li>
          {editors.map((editor) => (
            <li
              className="flex items-center justify-between gap-3 rounded-lg border px-2 py-1.5"
              key={editor.id}
            >
              <MemberLabel member={editor} />
              <span className="flex shrink-0 items-center gap-1">
                {onTransfer && transferableIds.includes(editor.id) && (
                  <Button
                    aria-label={`Make ${memberName(editor)} the owner`}
                    disabled={busy}
                    onClick={() => setConfirming(editor)}
                    size="sm"
                    type="button"
                    variant="button-transparent"
                  >
                    Make owner
                  </Button>
                )}
                <Button
                  aria-label={`Remove ${memberName(editor)}`}
                  disabled={busy}
                  onClick={() => onEditorsChange(editors.filter(({ id }) => id !== editor.id))}
                  size="sm"
                  type="button"
                  variant="button-transparent"
                >
                  Remove
                </Button>
              </span>
            </li>
          ))}
        </ul>

        {formError && <FieldError role="alert">{formError}</FieldError>}

        {confirming ? (
          <DialogFooter className="sm:items-center sm:justify-between">
            <p className="text-sm">
              Make {memberName(confirming)} the owner? You stay on as an editor, but only they can
              change the course's editors.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                borderColor="charcoal"
                disabled={busy}
                onClick={() => setConfirming(null)}
                type="button"
                variant="button-transparent"
              >
                Keep ownership
              </Button>
              <Button
                disabled={busy}
                onClick={() => onTransfer?.(confirming)}
                type="button"
                variant="button-destructive"
              >
                {saving === "transfer" ? "Transferring..." : "Transfer ownership"}
              </Button>
            </div>
          </DialogFooter>
        ) : (
          <DialogFooter>
            <DialogClose
              render={<Button borderColor="charcoal" type="button" variant="button-transparent" />}
            >
              Cancel
            </DialogClose>
            <Button disabled={busy} onClick={onSave} type="button" variant="button-mauve">
              {saving === "editors" ? "Saving..." : "Save editors"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
