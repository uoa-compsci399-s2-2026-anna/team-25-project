// Excludes text/html and image/svg+xml deliberately - both can carry an
// embedded <script> and are served from our own origin.
export const RESOURCE_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
] as const

export type ResourceAttachmentMimeType = (typeof RESOURCE_ATTACHMENT_MIME_TYPES)[number]

// Keyed by the list above, so allowing a new type fails to compile until it has a label.
export const RESOURCE_ATTACHMENT_TYPE_LABELS: Record<ResourceAttachmentMimeType, string> = {
  "application/pdf": "PDF",
  "application/msword": "Word document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word document",
  "application/vnd.ms-powerpoint": "PowerPoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint",
  "application/vnd.ms-excel": "Spreadsheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Spreadsheet",
  "text/plain": "Text",
  "text/csv": "CSV",
}

/** The label for a stored attachment's type, or `undefined` for one outside the allowed list. */
export const resourceAttachmentTypeLabel = (mimeType: string | null | undefined) =>
  mimeType && mimeType in RESOURCE_ATTACHMENT_TYPE_LABELS
    ? RESOURCE_ATTACHMENT_TYPE_LABELS[mimeType as ResourceAttachmentMimeType]
    : undefined
