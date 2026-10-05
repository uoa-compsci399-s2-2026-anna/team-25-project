import type { BibtexImportMessage, BibtexImportResult } from "@repo/shared/utils/bibtex-import"
import { CircleAlertIcon, InfoIcon } from "lucide-react"

export const BIBTEX_DEBOUNCE_MS = 400

export const LOAD_ERROR: BibtexImportResult = {
  values: {},
  messages: [
    {
      level: "error",
      text: "Could not load the BibTeX reader. Reload the page, or fill in the form by hand.",
    },
  ],
  coAuthorNames: [],
  filledCount: 0,
}

export const IMPORT_ERROR: BibtexImportResult = {
  values: {},
  messages: [{ level: "error", text: "Could not import this entry. Fill in the form by hand." }],
  coAuthorNames: [],
  filledCount: 0,
}

export const PLACEHOLDER = "@article{key,\n  title = {...},\n  author = {...},\n  year = {2024}\n}"

export const MESSAGE_STYLES = {
  error: { icon: CircleAlertIcon, className: "text-destructive" },
  warning: { icon: CircleAlertIcon, className: "text-amber-700" },
  info: { icon: InfoIcon, className: "text-muted-foreground" },
} satisfies Record<BibtexImportMessage["level"], { icon: unknown; className: string }>
