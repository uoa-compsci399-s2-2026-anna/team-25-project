"use client"

import { ListItemNode, ListNode } from "@lexical/list"
import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  HEADING,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  ORDERED_LIST,
  QUOTE,
  UNORDERED_LIST,
} from "@lexical/markdown"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { TablePlugin } from "@lexical/react/LexicalTablePlugin"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table"
import { textAreaVariants } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import type { EditorThemeClasses, SerializedEditorState, SerializedLexicalNode } from "lexical"
import { Component, type ReactNode, useEffect } from "react"
import { RichTextToolbar } from "./rich-text-toolbar"

const NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  TableNode,
  TableRowNode,
  TableCellNode,
]

const SUPPORTED_TYPES = new Set([
  "root",
  "paragraph",
  "text",
  "linebreak",
  "tab",
  ...NODES.map((node) => node.getType()),
])

type Node = SerializedLexicalNode & { children?: unknown }

const findUnsupportedTypes = (node: unknown, found = new Set<string>()) => {
  if (typeof node !== "object" || node === null || typeof (node as Node).type !== "string") {
    found.add("invalid node")
    return found
  }
  const { children, type } = node as Node
  if (!SUPPORTED_TYPES.has(type)) found.add(type)
  if (Array.isArray(children)) for (const child of children) findUnsupportedTypes(child, found)
  return found
}

// Lexical throws on each of these, so the editor does not mount for them. Unknown nodes are
// not dropped, or the next save would delete them.
const findLoadProblem = (value: RichTextValue) => {
  const root = value.root
  if (root?.type !== "root" || !Array.isArray(root.children)) return "it is not rich text"
  const unsupported = [...findUnsupportedTypes(root)]
  return unsupported.length > 0
    ? `it uses formatting the editor cannot edit (${unsupported.join(", ")})`
    : null
}

// Lexical cannot load a root with no children. It is the same as no content.
const isEmpty = (value: RichTextValue) =>
  Array.isArray(value.root?.children) && value.root.children.length === 0

// Only the formats the toolbar offers. Their nodes must be in NODES.
const TRANSFORMERS = [
  HEADING,
  QUOTE,
  UNORDERED_LIST,
  ORDERED_LIST,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
]

// Underline renders as a plain span, and bold with italic renders as one <strong>, so the
// text formats still need classes. So does the table's scroll wrapper, a plain <div>.
// Lexical hides the browser selection while cells are selected, so the cells show it instead.
const theme: EditorThemeClasses = {
  tableCellSelected: "bg-brand-charcoal/10",
  tableScrollableWrapper: "overflow-x-auto",
  tableSelection: "[&_*::selection]:bg-transparent",
  text: { bold: "font-bold", italic: "italic", underline: "underline" },
}

/**
 * Payload `richText` state. The index signature matches Payload's generated field types, so
 * the value can go to and from a Payload field without a cast.
 */
type RichTextValue = SerializedEditorState & { [key: string]: unknown }

type RichTextEditorProps = {
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  "aria-labelledby"?: string
  className?: string
  /**
   * Read once on mount. The editor is uncontrolled, so to load a different record, remount
   * it with `key={record.id}`.
   */
  defaultValue?: RichTextValue
  disabled?: boolean
  id?: string
  onBlur?: () => void
  onChange?: (value: RichTextValue) => void
  placeholder?: string
}

const RichTextEditor = ({
  className,
  defaultValue,
  disabled = false,
  onBlur,
  onChange,
  placeholder = "",
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-labelledby": ariaLabelledBy,
}: RichTextEditorProps) => {
  const initialValue = defaultValue && !isEmpty(defaultValue) ? defaultValue : undefined
  const loadProblem = initialValue ? findLoadProblem(initialValue) : null

  if (loadProblem) {
    console.error("RichTextEditor: defaultValue cannot be loaded", { id, loadProblem })
    return (
      <EditorAlert className={className}>This content cannot be edited: {loadProblem}.</EditorAlert>
    )
  }

  return (
    <EditorErrorBoundary className={className}>
      <LexicalComposer
        initialConfig={{
          editable: !disabled,
          // LexicalComposer takes a JSON string or an EditorState, not a plain object.
          editorState: initialValue ? JSON.stringify(initialValue) : undefined,
          namespace: "RichTextEditor",
          nodes: NODES,
          // Throwing skips Lexical's reset to the last good state, so production only logs.
          onError: (error) => {
            console.error("RichTextEditor:", error)
            if (process.env.NODE_ENV !== "production") throw error
          },
          theme,
        }}
      >
        <div className={cn("flex flex-col gap-2", className)} data-slot="rich-text-editor">
          <RichTextToolbar disabled={disabled} />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  aria-placeholder={placeholder}
                  ariaDescribedBy={ariaDescribedBy}
                  ariaInvalid={ariaInvalid}
                  ariaLabelledBy={ariaLabelledBy}
                  ariaMultiline
                  className={cn(
                    textAreaVariants({ variant: "box" }),
                    "rich-text min-h-40",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                  id={id}
                  onBlur={onBlur}
                  placeholder={
                    <div className="pointer-events-none absolute top-2 left-3 font-light text-base text-muted-foreground/70 italic md:text-sm">
                      {placeholder}
                    </div>
                  }
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
        </div>
        <HistoryPlugin />
        <ListPlugin />
        {/* Same flags as Payload's admin table plugin. With cell merge off, Lexical would
            flatten merged cells made in the admin on load, and the next save would lose them. */}
        <TablePlugin hasCellBackgroundColor={false} hasCellMerge hasHorizontalScroll />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin
          ignoreSelectionChange
          onChange={(state) => onChange?.(state.toJSON() as RichTextValue)}
        />
        <EditablePlugin editable={!disabled} />
      </LexicalComposer>
    </EditorErrorBoundary>
  )
}

const EditorAlert = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn("text-destructive text-sm", className)} role="alert">
    {children}
  </p>
)

// Catches errors thrown while the editor renders, such as a failed parse of defaultValue.
class EditorErrorBoundary extends Component<
  { children: ReactNode; className?: string },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error("RichTextEditor: the editor failed", error)
  }

  render() {
    if (this.state.failed) {
      return (
        <EditorAlert className={this.props.className}>
          The editor could not load. Reload the page to try again.
        </EditorAlert>
      )
    }
    return this.props.children
  }
}

// `initialConfig` is read once, so later `disabled` changes are pushed into the editor here.
const EditablePlugin = ({ editable }: { editable: boolean }) => {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    editor.setEditable(editable)
  }, [editor, editable])
  return null
}

export { RichTextEditor, type RichTextEditorProps, type RichTextValue }
