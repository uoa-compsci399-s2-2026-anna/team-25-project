"use client"

import type { BibtexImportResult, PersonName } from "@repo/shared/utils/bibtex-import"
import { Collapsible, CollapsiblePanel, FieldLabel, TextArea } from "@repo/ui/components/ui"
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

type BibtexImportProps = {
  /** The signed-in member, found in (or added to) the imported author list. */
  self: PersonName
  onImport: (result: BibtexImportResult) => void
}

export const BibtexImport = ({ self, onImport }: BibtexImportProps) => {
  const [open, setOpen] = useState(true)
  const [text, setText] = useState("")
  const [result, setResult] = useState<BibtexImportResult | null>(null)
  const lastParsed = useRef("")
  const textAreaId = useId()
  const [debouncedText] = useDebouncedValue(text.trim(), { wait: BIBTEX_DEBOUNCE_MS })

  // An effect event reads the latest props without restarting the debounce when they change.
  const parse = useEffectEvent(async (trimmed: string) => {
    lastParsed.current = trimmed
    if (!trimmed) {
      setResult(null)
      return
    }

    let parser: Awaited<ReturnType<typeof loadParser>>
    try {
      parser = await loadParser()
    } catch (error) {
      console.error("Could not load the BibTeX parser", error)
      // Let the next edit try again.
      lastParsed.current = ""
      setResult(LOAD_ERROR)
      return
    }
    // The text changed while the parser loaded. That newer text gets its own parse.
    if (lastParsed.current !== trimmed) return

    try {
      const parsed = parser.parseBibtexImport(trimmed, self)
      setResult(parsed)
      if (parsed.messages.some((message) => message.level === "error")) return

      onImport(parsed)
      setOpen(false)
    } catch (error) {
      console.error("BibTeX import failed", error)
      setResult(IMPORT_ERROR)
    }
  })

  useEffect(() => {
    // Only a preload: a failure shows when the user pastes BibTeX.
    if (open) loadParser().catch(() => {})
  }, [open])

  useEffect(() => {
    if (debouncedText !== lastParsed.current) void parse(debouncedText)
  }, [debouncedText])

  const succeeded = result && !result.messages.some((message) => message.level === "error")

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
              placeholder={PLACEHOLDER}
              spellCheck={false}
              value={text}
            />
          </div>
        </CollapsiblePanel>
      </Collapsible>

      {/* Outside the panel, so the results stay visible after it collapses. */}
      <div aria-live="polite" className="flex flex-col gap-1 text-sm">
        {succeeded && (
          <p className="flex items-center gap-2 text-brand-teal">
            <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />
            Filled {result.filledCount} {result.filledCount === 1 ? "field" : "fields"} from BibTeX.
            Check them before you add the publication.
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
