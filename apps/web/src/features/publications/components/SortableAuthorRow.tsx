"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { GripVertical } from "lucide-react"
import type { ReactNode } from "react"

type SortableAuthorRowProps = {
  id: string
  position: number
  children: ReactNode
}

export const SortableAuthorRow = ({ id, position, children }: SortableAuthorRowProps) => {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  return (
    <div
      className={cn(
        "relative flex items-start gap-2 rounded-lg bg-background",
        isDragging && "z-10 shadow-lg",
      )}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {/* Only the handle starts a drag, so typing in the row's input still works. */}
      <Button
        aria-label={`Reorder author ${position}`}
        className="mt-1 cursor-grab touch-none active:cursor-grabbing"
        ref={setActivatorNodeRef}
        size="icon-sm"
        type="button"
        variant="button-transparent"
        {...attributes}
        {...listeners}
      >
        <GripVertical />
      </Button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
