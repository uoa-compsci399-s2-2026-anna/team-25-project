"use client"

import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui"
import { PlusIcon } from "lucide-react"
import type * as React from "react"

export type CourseOfferingStatus = "draft" | "published"

const statusLabels: Record<CourseOfferingStatus, string> = {
  draft: "Draft",
  published: "Published",
}

// Matches the courses table's status column.
const statusVariants = {
  draft: "secondary",
  published: "blue",
} as const

export type CourseOfferingsManagerItem = {
  id: number
  /** The offering's period, or a placeholder for a draft without one yet. */
  period: string
  status: CourseOfferingStatus
  /** A second line, e.g. the dates and name. */
  detail?: string
}

export type CourseOfferingsManagerProps = {
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Named in the description, e.g. "COMPSCI 399". */
  courseCode: string
  /** Every offering, drafts included, in the order to list them. */
  items: CourseOfferingsManagerItem[]
  onAdd: () => void
  /** Opens the offering to edit: a draft freely, a published one as a correction. */
  onOpen: (id: number) => void
}

/**
 * Every offering of a course for its owner and editors, drafts included, with a
 * way into each and a button to add another. What opening one does is left to the caller.
 */
export function CourseOfferingsManager({
  trigger,
  open,
  onOpenChange,
  courseCode,
  items,
  onAdd,
  onOpen,
}: CourseOfferingsManagerProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        showCloseButton={false}
      >
        <div className="min-h-0 overflow-y-auto p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <DialogTitle className="font-bold text-2xl">Manage offerings</DialogTitle>
              <DialogDescription>
                Every offering of {courseCode}, drafts included. Drafts stay hidden from the course
                page until they're published.
              </DialogDescription>
            </div>
            <DialogClose render={<Button size="sm" variant="button-transparent" />}>
              Close
            </DialogClose>
          </div>

          <ul className="mt-6 flex flex-col divide-y rounded-md border">
            {items.map((item) => (
              <li className="flex items-center justify-between gap-3 px-3 py-2.5" key={item.id}>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{item.period}</span>
                    <Badge variant={statusVariants[item.status]}>{statusLabels[item.status]}</Badge>
                  </span>
                  {item.detail && (
                    <span className="truncate text-muted-foreground text-xs">{item.detail}</span>
                  )}
                </div>
                <Button
                  aria-label={`Edit ${item.period}`}
                  borderColor="charcoal"
                  className="shrink-0"
                  onClick={() => onOpen(item.id)}
                  size="sm"
                  type="button"
                  variant="button-transparent"
                >
                  Edit
                </Button>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex justify-end">
            <Button onClick={onAdd} type="button" variant="button-mauve">
              <PlusIcon aria-hidden="true" />
              Add offering
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
