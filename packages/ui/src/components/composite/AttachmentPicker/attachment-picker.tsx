"use client"

import { Button } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { FileText, Paperclip, X } from "lucide-react"
import { useId, useRef } from "react"
import { formatFileSize } from "../AttachmentList/attachment-list"

type AttachmentPickerProps = {
  files: File[]
  onFilesChange: (files: File[]) => void
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
      {files.length > 0 && (
        <ul className="flex w-fit max-w-full flex-col divide-y rounded-lg border">
          {files.map((file) => (
            <li className="flex items-center gap-3 px-4 py-2" key={fileKey(file)}>
              <FileText aria-hidden className="size-5 shrink-0 text-muted-foreground" />
              <div className="mr-auto flex min-w-0 flex-col pr-3">
                <p className="truncate font-medium text-sm">{file.name}</p>
                <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
              </div>
              <Button
                aria-label={`Remove ${file.name}`}
                className="shrink-0"
                disabled={disabled}
                onClick={() => onFilesChange(files.filter((other) => other !== file))}
                size="icon"
                type="button"
                variant="button-transparent"
              >
                <X />
              </Button>
            </li>
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

export { AttachmentPicker, type AttachmentPickerProps }
