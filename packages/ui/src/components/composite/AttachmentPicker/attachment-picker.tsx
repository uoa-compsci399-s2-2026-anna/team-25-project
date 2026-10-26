"use client"

import { Button } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { FileText, Paperclip, X } from "lucide-react"
import { useId, useRef } from "react"
import { formatFileSize } from "../AttachmentList/attachment-list"

/** A file the record already has, e.g. when editing a resource. */
type SavedAttachment = { id: number | string; name: string; size?: number }

type AttachmentPickerProps = {
  files: File[]
  onFilesChange: (files: File[]) => void
  /** Files already saved, listed above the picked ones. Removing one calls `onSavedChange`. */
  saved?: SavedAttachment[]
  onSavedChange?: (saved: SavedAttachment[]) => void
  /** Passed to the file input, e.g. a list of MIME types. */
  accept?: string
  /** Goes on the "Add files" button, so a field label can point at it. */
  id?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
  /**
   * The field's label. The button is named by it and then its own text ("Attachments, Add
   * files"), since a `<label for>` would replace the button's text instead.
   */
  "aria-labelledby"?: string
  /** The field's hint and error, so they are read out with the button. */
  "aria-describedby"?: string
}

// Picking the same file twice adds nothing, since there is no way to tell the copies apart.
const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

const AttachmentRow = ({
  disabled,
  name,
  onRemove,
  size,
}: {
  disabled?: boolean
  name: string
  onRemove: () => void
  size?: number
}) => (
  <li className="flex items-center gap-3 px-4 py-2">
    <FileText aria-hidden className="size-5 shrink-0 text-muted-foreground" />
    <div className="mr-auto flex min-w-0 flex-col pr-3">
      <p className="truncate font-medium text-sm">{name}</p>
      {size !== undefined && (
        <p className="text-muted-foreground text-xs">{formatFileSize(size)}</p>
      )}
    </div>
    <Button
      aria-label={`Remove ${name}`}
      className="shrink-0"
      disabled={disabled}
      onClick={onRemove}
      size="icon"
      type="button"
      variant="button-transparent"
    >
      <X />
    </Button>
  </li>
)

function AttachmentPicker({
  "aria-describedby": describedBy,
  "aria-labelledby": labelledBy,
  accept,
  className,
  disabled,
  files,
  id,
  invalid,
  onFilesChange,
  onSavedChange,
  saved = [],
}: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const fallbackId = useId()
  const buttonId = id ?? fallbackId

  const addFiles = (picked: FileList | null) => {
    if (!picked) return
    const keys = new Set(files.map(fileKey))
    onFilesChange([...files, ...[...picked].filter((file) => !keys.has(fileKey(file)))])
  }

  return (
    <div className={cn("flex flex-col items-start gap-3", className)}>
      {saved.length + files.length > 0 && (
        <ul className="flex w-fit max-w-full flex-col divide-y rounded-lg border">
          {saved.map((attachment) => (
            <AttachmentRow
              disabled={disabled}
              key={`saved-${attachment.id}`}
              name={attachment.name}
              onRemove={() => onSavedChange?.(saved.filter((other) => other !== attachment))}
              size={attachment.size}
            />
          ))}
          {files.map((file) => (
            <AttachmentRow
              disabled={disabled}
              key={fileKey(file)}
              name={file.name}
              onRemove={() => onFilesChange(files.filter((other) => other !== file))}
              size={file.size}
            />
          ))}
        </ul>
      )}

      {/* The visible button opens this, so the input itself stays out of the tab order. */}
      <input
        accept={accept}
        className="hidden"
        disabled={disabled}
        multiple
        onChange={(event) => {
          addFiles(event.target.files)
          // Cleared so picking the same file again after removing it still fires a change.
          event.target.value = ""
        }}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />
      <Button
        aria-describedby={describedBy}
        aria-invalid={invalid}
        aria-labelledby={labelledBy ? `${labelledBy} ${buttonId}` : undefined}
        borderColor="charcoal"
        disabled={disabled}
        id={buttonId}
        onClick={() => inputRef.current?.click()}
        size="md"
        type="button"
        variant="button-transparent"
      >
        <Paperclip data-icon="inline-start" />
        Add files
      </Button>
    </div>
  )
}

export { AttachmentPicker, type AttachmentPickerProps, type SavedAttachment }
