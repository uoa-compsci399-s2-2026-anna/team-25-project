"use client"

import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar"
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  type ListType,
  REMOVE_LIST_COMMAND,
} from "@lexical/list"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
} from "@lexical/rich-text"
import { $setBlocksType } from "@lexical/selection"
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $findTableNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  INSERT_TABLE_COMMAND,
} from "@lexical/table"
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils"
import {
  buttonVariants,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import {
  $createParagraphNode,
  $findMatchingParent,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  type ElementNode,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical"
import {
  BetweenHorizontalEnd,
  BetweenVerticalEnd,
  Bold,
  Columns3,
  Italic,
  List,
  ListOrdered,
  type LucideIcon,
  Quote,
  Redo2,
  Rows3,
  Table,
  Trash2,
  Underline,
  Undo2,
} from "lucide-react"
import { useEffect, useState } from "react"

const TEXT_STYLES = [
  { label: "Paragraph", value: "paragraph" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
  { label: "Heading 5", value: "h5" },
  { label: "Heading 6", value: "h6" },
] as const

type TextStyle = (typeof TEXT_STYLES)[number]["value"]

type BlockType = TextStyle | "quote" | ListType

const isTextStyle = (type: BlockType): type is TextStyle =>
  TEXT_STYLES.some((style) => style.value === type)

type ToolbarState = {
  blockType: BlockType
  canRedo: boolean
  canUndo: boolean
  inTable: boolean
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
}

const initialState: ToolbarState = {
  blockType: "paragraph",
  canRedo: false,
  canUndo: false,
  inTable: false,
  isBold: false,
  isItalic: false,
  isUnderline: false,
}

function useToolbarState() {
  const [editor] = useLexicalComposerContext()
  const [state, setState] = useState(initialState)

  useEffect(() => {
    // Runs inside a read or update, so the $ helpers have an active editor state.
    const readSelection = () => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const anchor = selection.anchor.getNode()
      // The nearest block, not the top-level element: inside a table that is the table itself.
      const block = $findMatchingParent(
        anchor,
        (node) =>
          $isElementNode(node) &&
          !node.isInline() &&
          ($isRootNode(node.getParent()) || $isTableCellNode(node.getParent())),
      )
      const list = $getNearestNodeOfType(anchor, ListNode)

      let blockType: BlockType = "paragraph"
      if (list) blockType = list.getListType()
      else if ($isHeadingNode(block)) blockType = block.getTag()
      else if ($isQuoteNode(block)) blockType = "quote"

      // Read everything here: React runs the updater later, outside the editor state.
      const next = {
        blockType,
        inTable: $findTableNode(anchor) !== null,
        isBold: selection.hasFormat("bold"),
        isItalic: selection.hasFormat("italic"),
        isUnderline: selection.hasFormat("underline"),
      }
      setState((prev) => ({ ...prev, ...next }))
    }

    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => editorState.read(readSelection)),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          readSelection()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (canUndo) => {
          setState((prev) => ({ ...prev, canUndo }))
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (canRedo) => {
          setState((prev) => ({ ...prev, canRedo }))
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor])

  return state
}

const RichTextToolbar = ({ disabled }: { disabled: boolean }) => {
  const [editor] = useLexicalComposerContext()
  const state = useToolbarState()

  // Clicking the active block type turns it back into a paragraph.
  const setBlock = (type: BlockType, create: () => ElementNode) =>
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const next: () => ElementNode = state.blockType === type ? $createParagraphNode : create
      $setBlocksType(selection, next)
    })

  const setTextStyle = (style: TextStyle) => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      $setBlocksType(selection, () =>
        style === "paragraph" ? $createParagraphNode() : $createHeadingNode(style),
      )
    })
    editor.focus()
  }

  const deleteTable = () =>
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) $findTableNode(selection.anchor.getNode())?.remove()
    })

  const toggleList = (type: Exclude<ListType, "check">) => {
    if (state.blockType === type) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    } else {
      const command =
        type === "bullet" ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND
      editor.dispatchCommand(command, undefined)
    }
  }

  return (
    <ToolbarPrimitive.Root
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-1"
      data-slot="rich-text-toolbar"
    >
      <ToolbarPrimitive.Group aria-label="History" className="flex gap-1">
        <ToolbarButton
          disabled={disabled || !state.canUndo}
          icon={Undo2}
          label="Undo"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        />
        <ToolbarButton
          disabled={disabled || !state.canRedo}
          icon={Redo2}
          label="Redo"
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        />
      </ToolbarPrimitive.Group>
      <ToolbarSeparator />
      <ToolbarPrimitive.Group aria-label="Text format" className="flex gap-1">
        <ToolbarButton
          disabled={disabled}
          icon={Bold}
          label="Bold"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          pressed={state.isBold}
        />
        <ToolbarButton
          disabled={disabled}
          icon={Italic}
          label="Italic"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
          pressed={state.isItalic}
        />
        <ToolbarButton
          disabled={disabled}
          icon={Underline}
          label="Underline"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
          pressed={state.isUnderline}
        />
      </ToolbarPrimitive.Group>
      <ToolbarSeparator />
      <ToolbarPrimitive.Group aria-label="Block type" className="flex gap-1">
        <Select<TextStyle>
          disabled={disabled}
          items={TEXT_STYLES}
          onValueChange={(value) => value !== null && setTextStyle(value)}
          // Blocks with no text style, such as quotes and lists, show the placeholder.
          value={isTextStyle(state.blockType) ? state.blockType : null}
        >
          <ToolbarPrimitive.Button
            aria-label="Text style"
            disabled={disabled}
            render={<SelectTrigger className="w-32" size="sm" />}
          >
            <SelectValue placeholder="Text style" />
          </ToolbarPrimitive.Button>
          <SelectContent alignItemWithTrigger={false}>
            {TEXT_STYLES.map((style) => (
              <SelectItem key={style.value} value={style.value}>
                {style.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToolbarButton
          disabled={disabled}
          icon={Quote}
          label="Quote"
          onClick={() => setBlock("quote", $createQuoteNode)}
          pressed={state.blockType === "quote"}
        />
      </ToolbarPrimitive.Group>
      <ToolbarSeparator />
      <ToolbarPrimitive.Group aria-label="Lists" className="flex gap-1">
        <ToolbarButton
          disabled={disabled}
          icon={List}
          label="Bulleted list"
          onClick={() => toggleList("bullet")}
          pressed={state.blockType === "bullet"}
        />
        <ToolbarButton
          disabled={disabled}
          icon={ListOrdered}
          label="Numbered list"
          onClick={() => toggleList("number")}
          pressed={state.blockType === "number"}
        />
      </ToolbarPrimitive.Group>
      <ToolbarSeparator />
      <ToolbarPrimitive.Group aria-label="Insert" className="flex gap-1">
        <ToolbarButton
          // Lexical does not support tables inside tables.
          disabled={disabled || state.inTable}
          icon={Table}
          label="Insert table"
          onClick={() =>
            editor.dispatchCommand(INSERT_TABLE_COMMAND, {
              columns: "3",
              includeHeaders: { columns: false, rows: true },
              rows: "3",
            })
          }
        />
      </ToolbarPrimitive.Group>
      {state.inTable && (
        <>
          <ToolbarSeparator />
          <ToolbarPrimitive.Group aria-label="Table" className="flex gap-1">
            <ToolbarButton
              disabled={disabled}
              icon={BetweenHorizontalEnd}
              label="Add row"
              onClick={() => editor.update(() => $insertTableRowAtSelection(true))}
            />
            <ToolbarButton
              disabled={disabled}
              icon={BetweenVerticalEnd}
              label="Add column"
              onClick={() => editor.update(() => $insertTableColumnAtSelection(true))}
            />
            <ToolbarButton
              disabled={disabled}
              icon={Rows3}
              label="Delete row"
              onClick={() => editor.update(() => $deleteTableRowAtSelection())}
            />
            <ToolbarButton
              disabled={disabled}
              icon={Columns3}
              label="Delete column"
              onClick={() => editor.update(() => $deleteTableColumnAtSelection())}
            />
            <ToolbarButton
              disabled={disabled}
              icon={Trash2}
              label="Delete table"
              onClick={deleteTable}
            />
          </ToolbarPrimitive.Group>
        </>
      )}
    </ToolbarPrimitive.Root>
  )
}

const ToolbarButton = ({
  disabled,
  icon: Icon,
  label,
  onClick,
  pressed,
}: {
  disabled: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
  pressed?: boolean
}) => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ToolbarPrimitive.Button
            aria-label={label}
            aria-pressed={pressed}
            className={cn(
              buttonVariants({ size: "icon-sm", variant: "button-transparent" }),
              "rounded-md aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-pressed:bg-brand-charcoal/15",
            )}
            disabled={disabled}
            onClick={onClick}
            // Keep the editor's selection when a button is clicked.
            onMouseDown={(event) => event.preventDefault()}
          />
        }
      >
        <Icon />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

const ToolbarSeparator = () => <ToolbarPrimitive.Separator className="mx-1 h-5 w-px bg-border" />

export { RichTextToolbar }
