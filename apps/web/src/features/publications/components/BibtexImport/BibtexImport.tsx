"use client"

import type { BibtexImportResult, PersonName } from "@repo/shared/utils/bibtex-import"
import { Button, Collapsible, CollapsiblePanel, FieldLabel, TextArea } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { CircleCheckIcon } from "lucide-react"
import { useEffect, useEffectEvent, useId, useRef, useState } from "react"
import { SectionTrigger } from "../SectionTrigger"
import {
  BIBTEX_DEBOUNCE_MS,
  IMPORT_ERROR,
  LOAD_ERROR,
  MESSAGE_STYLES,
  PLACEHOLDER,
} from "./BibtexImport.constants"

// The parser is large, so keep it out of the page bundle. It loads when the
// import section is open, which it is by default when the dialog opens.
const loadParser = () => import("@repo/shared/utils/bibtex-import")

const hasError = (result: BibtexImportResult) =>
  result.messages.some((message) => message.level === "error")

const fieldCount = (count: number) => `${count} ${count === 1 ? "field" : "fields"}`

/** What the form did with an import. A field the user changed is kept, not filled. */
export type ImportSummary = { filled: number; kept: number }

type BibtexImportProps = {
  /** The signed-in member, found in (or added to) the imported author list. */
  self: PersonName
  onImport: (result: BibtexImportResult) => ImportSummary
}

/**
 * A paste that replaces all the text imports at once. Typed changes only show a
 * preview, so a pause while typing does not import a half-typed entry. The user
 * imports typed changes with the button, Ctrl+Enter or Cmd+Enter.
 */
export const BibtexImport = ({ self, onImport }: BibtexImportProps) => {
  const [open, setOpen] = useState(true)
  const [text, setText] = useState("")
  // The summary is set only when the form applied the import.
  const [status, setStatus] = useState<{
    result: BibtexImportResult
    summary?: ImportSummary
  } | null>(null)
  const [importedText, setImportedText] = useState<string | null>(null)
  // The text of the newest parse, and an id so an older parse cannot overwrite it.
  const lastParsed = useRef("")
  const parseId = useRef(0)
  const textAreaId = useId()
  const trimmed = text.trim()
  const [debouncedText] = useDebouncedValue(trimmed, { wait: BIBTEX_DEBOUNCE_MS })

  // An effect event reads the latest props without restarting the debounce when they change.
  const parse = useEffectEvent(async (entry: string, apply: boolean) => {
    const id = ++parseId.current
    lastParsed.current = entry
    if (!entry) {
      setStatus(null)
      return
    }

    let parser: Awaited<ReturnType<typeof loadParser>>
    try {
      parser = await loadParser()
    } catch (error) {
      console.error("Could not load the BibTeX parser", error)
      // Let the next edit try again.
      lastParsed.current = ""
      setStatus({ result: LOAD_ERROR })
      return
    }
    // A newer parse started while the parser loaded.
    if (id !== parseId.current) return

    try {
      const parsed = parser.parseBibtexImport(entry, self)
      const summary = apply && !hasError(parsed) ? onImport(parsed) : undefined
      if (summary) {
        setImportedText(entry)
        setOpen(false)
      }
      setStatus({ result: parsed, summary })
    } catch (error) {
      console.error("BibTeX import failed", error)
      setStatus({ result: IMPORT_ERROR })
    }
  })

  useEffect(() => {
    // Only a preload: a failure shows when the user pastes BibTeX.
    if (open) loadParser().catch(() => {})
  }, [open])

  useEffect(() => {
    if (debouncedText !== lastParsed.current) void parse(debouncedText, false)
  }, [debouncedText])

  const canImport = trimmed !== "" && trimmed !== importedText
  const importText = () => {
    if (canImport) void parse(trimmed, true)
  }

  const result = status?.result
  const succeeded = result && !hasError(result)

  return (
    <div className="flex flex-col gap-2">
      <Collapsible onOpenChange={setOpen} open={open}>
        <SectionTrigger>Import from BibTeX</SectionTrigger>
        <CollapsiblePanel>
          <div className="flex flex-col gap-2 pt-3">
            <FieldLabel htmlFor={textAreaId}>Paste a BibTeX entry</FieldLabel>
            <TextArea
              className="min-h-32 font-mono text-xs md:text-xs"
              id={textAreaId}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                // Enter alone adds a new line, because BibTeX has many lines.
                if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return
                event.preventDefault()
                importText()
              }}
              onPaste={(event) => {
                const { selectionStart, selectionEnd, value } = event.currentTarget
                // Pasting part of an entry is an edit, not a new entry.
                if (selectionStart !== 0 || selectionEnd !== value.length) return
                void parse(event.clipboardData.getData("text").trim(), true)
              }}
              placeholder={PLACEHOLDER}
              spellCheck={false}
              value={text}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs">
                Paste to import, or press Ctrl+Enter (⌘+Enter on Mac) after you edit.
              </p>
              <Button
                disabled={!canImport}
                onClick={importText}
                size="sm"
                type="button"
                variant="button-transparent"
              >
                {importedText === null ? "Import" : "Re-import"}
              </Button>
            </div>
          </div>
        </CollapsiblePanel>
      </Collapsible>

      {/* Outside the panel, so the results stay visible after it collapses. */}
      <div aria-live="polite" className="flex flex-col gap-1 text-sm">
        {status?.summary && (
          <p className="flex items-center gap-2 text-brand-teal">
            <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />
            Filled {fieldCount(status.summary.filled)} from BibTeX.
            {status.summary.kept > 0 && ` Kept ${fieldCount(status.summary.kept)} you changed.`}{" "}
            Check them before you add the publication.
          </p>
        )}
        {succeeded && !status.summary && canImport && (
          <p className="text-muted-foreground">
            Ready to fill {fieldCount(result.filledCount)}. Select{" "}
            {importedText === null ? "Import" : "Re-import"} to fill the form.
          </p>
        )}
        {result && result.messages.length > 0 && (
          <ul className="flex flex-col gap-1">
            {result.messages.map((message) => {
              const { icon: Icon, className } = MESSAGE_STYLES[message.level]
              return (
                <li className={cn("flex items-start gap-2", className)} key={message.text}>
                  <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="sr-only">{message.level}: </span>
                    {message.text}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
