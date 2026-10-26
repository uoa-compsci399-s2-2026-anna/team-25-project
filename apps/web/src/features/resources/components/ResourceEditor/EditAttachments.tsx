"use client"

import {
  RESOURCE_ATTACHMENT_MIME_TYPES,
  RESOURCE_ATTACHMENTS_MAX_FILES,
  RESOURCE_ATTACHMENTS_MAX_MB,
} from "@repo/shared/constants/resource-attachments"
import type { resourceAttachmentsEditSchema } from "@repo/shared/schemas/resources"
import {
  type AttachmentListItem,
  AttachmentPicker,
  formatFileSize,
} from "@repo/ui/components/composite"
import { Button } from "@repo/ui/components/ui"
import { FileText, X } from "lucide-react"
import { type ReactNode, useId } from "react"
import type { z } from "zod"
import { EditField } from "@/components/Editor/EditField"

/** What EditAttachments writes to its field: saved files still linked, and new ones to upload. */
export type EditAttachmentsValue = z.input<typeof resourceAttachmentsEditSchema>

/**
 * The saved files with a remove button each, and a picker for new ones. Removing only
 * unlinks a file - its upload stays, as only admins can delete one.
 */
export const EditAttachments = ({
  existing,
  label,
  name,
  view,
}: {
  /** The saved files, so the kept ones can be listed by name. */
  existing: AttachmentListItem[]
  label: string
  name: string
  view?: ReactNode
}) => {
  const labelId = useId()
  const hintId = useId()

  return (
    <EditField<EditAttachmentsValue>
      label={label}
      name={name}
      value={{ add: [], keep: existing.map((file) => Number(file.id)) }}
      view={view}
    >
      {({ disabled, id, invalid, label: fieldLabel, setValue, value: { add, keep } }) => {
        const kept = existing.filter((file) => keep.includes(Number(file.id)))

        return (
          <div className="flex flex-col items-start gap-3">
            <span className="sr-only" id={labelId}>
              {fieldLabel}
            </span>
            {kept.length > 0 && (
              <ul
                aria-labelledby={labelId}
                className="flex w-fit max-w-full flex-col divide-y rounded-lg border"
              >
                {kept.map((file) => (
                  <li className="flex items-center gap-3 px-4 py-2" key={file.id}>
                    <FileText aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                    <div className="mr-auto flex min-w-0 flex-col pr-3">
                      <p className="truncate font-medium text-sm">{file.name}</p>
                      {file.size != null && (
                        <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
                      )}
                    </div>
                    <Button
                      aria-label={`Remove ${file.name}`}
                      className="shrink-0"
                      disabled={disabled}
                      onClick={() =>
                        setValue({ add, keep: keep.filter((other) => other !== Number(file.id)) })
                      }
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
            <AttachmentPicker
              accept={RESOURCE_ATTACHMENT_MIME_TYPES.join(",")}
              aria-describedby={hintId}
              aria-labelledby={labelId}
              disabled={disabled}
              files={add}
              id={id}
              invalid={invalid}
              onFilesChange={(files) => setValue({ add: files, keep })}
            />
            <p className="text-muted-foreground text-xs" id={hintId}>
              PDF, Word, PowerPoint, Excel, text or CSV. Up to {RESOURCE_ATTACHMENTS_MAX_FILES}{" "}
              files, {RESOURCE_ATTACHMENTS_MAX_MB} MB of new files in total.
            </p>
          </div>
        )
      }}
    </EditField>
  )
}
