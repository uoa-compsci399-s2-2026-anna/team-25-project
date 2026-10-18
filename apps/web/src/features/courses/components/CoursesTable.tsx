"use client"

import {
  BadgeCell,
  DataTable,
  type DataTableFeatures,
  type DataTableInstance,
  isInteractiveDescendant,
  Skeleton,
  SortableHeader,
  StackedCell,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableVariantProps,
  TextCell,
  type UseDataTableOptions,
  useDataTable,
} from "@repo/ui/components/ui"
import { createColumnHelper } from "@tanstack/react-table"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createContext, useContext } from "react"
import { Routes } from "@/lib/routes"

/** One published offering of a row's course, as the period filters see it. */
export interface CourseTableOffering {
  offeringId?: number
  title: string
  lecturer: string
  /** The term's label, e.g. "Semester 2". */
  semester: string
  year: number
}

/**
 * `duration`, `students`, `teamSize`, and `industry` were dropped: none have
 * a backing field in `Course`/`CourseVersion` (see PR description).
 *
 * `semester`/`year` come from the offering's `term` and `year`.
 */
export interface CourseTableRow {
  id: string
  code: string
  title: string
  /** Single display name (e.g. course coordinator), not the full teaching
   * team - a table cell needs one line. */
  lecturer: string
  university: string
  semester: string
  year: number
  status: "draft" | "published"
  /**
   * Set once a period filter picks one of the course's offerings, so the row
   * opens that offering. Unset, it opens the course's current offering.
   */
  offeringId?: number
  /** The offering the row shows unfiltered, whose URL is the plain course URL. */
  currentOfferingId?: number
  /** Every published offering, newest first. Drafts have none. */
  offerings?: CourseTableOffering[]
}

const rowHref = (row: CourseTableRow) =>
  Routes.COURSES.OFFERING(row.id, row.offeringId, row.currentOfferingId)

const statusLabels = {
  draft: "Draft",
  published: "Published",
} as const

const statusVariants = {
  draft: "secondary",
  published: "blue",
} as const

// Lets a draft row open for editing in place of navigating to it - a draft has
// no course page yet. Shared through context because the column definitions
// below are static and can't close over page state.
const OpenDraftCourseContext = createContext<{
  canOpen: (row: CourseTableRow) => boolean
  open: (row: CourseTableRow) => void
} | null>(null)

const focusRing =
  "focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

function CourseCell({ label, row }: { label: string; row: CourseTableRow }) {
  const draftOpener = useContext(OpenDraftCourseContext)
  const cell = <StackedCell primary={label} secondary={row.lecturer} />

  if (draftOpener?.canOpen(row)) {
    return (
      <button
        className={`block w-full cursor-pointer rounded-sm text-left ${focusRing}`}
        onClick={() => draftOpener.open(row)}
        type="button"
      >
        {cell}
      </button>
    )
  }

  return (
    <Link className={`block rounded-sm ${focusRing}`} href={rowHref(row)}>
      {cell}
    </Link>
  )
}

const helper = createColumnHelper<DataTableFeatures, CourseTableRow>()

export const courseColumns = helper.columns([
  helper.accessor((row) => `${row.code} ${row.title}`, {
    id: "course",
    filterFn: "includesString",
    header: ({ column }) => <SortableHeader column={column}>Course</SortableHeader>,
    cell: ({ getValue, row }) => <CourseCell label={getValue()} row={row.original} />,
  }),
  helper.accessor("university", {
    header: ({ column }) => <SortableHeader column={column}>University</SortableHeader>,
    filterFn: "arrHas",
    cell: ({ getValue }) => <TextCell tone="muted">{getValue()}</TextCell>,
  }),
  // No filterFn on semester or year: CoursesListClient filters them across every
  // offering with matchOffering, which a column filter here would disagree with.
  helper.accessor("semester", {
    header: ({ column }) => <SortableHeader column={column}>Semester</SortableHeader>,
    cell: ({ getValue }) => <TextCell tone="muted">{getValue()}</TextCell>,
  }),
  helper.accessor("year", {
    header: ({ column }) => <SortableHeader column={column}>Year</SortableHeader>,
    cell: ({ getValue }) => <TextCell tone="muted">{getValue()}</TextCell>,
  }),
  helper.accessor("status", {
    header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
    filterFn: "arrHas",
    cell: ({ getValue }) => {
      const value = getValue()
      return <BadgeCell variant={statusVariants[value]}>{statusLabels[value]}</BadgeCell>
    },
  }),
])

// Mirrors `courseColumns`' header labels for the loading skeleton. Kept as a
// plain array rather than keyed by column id: TanStack only resolves `id`
// from `accessorKey` on runtime `Column` instances, not on the static
// `ColumnDef`s in `courseColumns` itself.
const courseColumnLabels = ["Course", "University", "Semester", "Year", "Status"] as const

type UseCoursesTableOptions = Omit<UseDataTableOptions<CourseTableRow>, "columns">

/** Thin preset over `useDataTable` pinned to the course columns above. */
export function useCoursesTable(options: UseCoursesTableOptions) {
  return useDataTable({ ...options, columns: courseColumns })
}

export type CoursesTableInstance = DataTableInstance<CourseTableRow>

// Names the table's scrolling region for screen readers.
const scrollLabel = "Capstone courses"

const SKELETON_ROW_COUNT = 8
// Stable per-row identity for the placeholder rows below, since they have no
// underlying data of their own to key off.
const skeletonRowIds = Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => `course-skeleton-${i}`)

export function CoursesTableSkeleton({ density, striped }: TableVariantProps) {
  return (
    <Table density={density} scrollLabel={scrollLabel} striped={striped}>
      <TableHeader>
        <TableRow>
          {courseColumnLabels.map((label) => (
            <TableHead key={label}>{label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {skeletonRowIds.map((rowId) => (
          <TableRow key={rowId}>
            {courseColumnLabels.map((label) => (
              <TableCell key={label}>
                <Skeleton className="h-4 w-full max-w-24" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export interface CoursesTableProps extends TableVariantProps {
  table: CoursesTableInstance
  isLoading?: boolean
  emptyMessage?: string
  /** Lets draft rows open for editing; without it every row links to its course page. */
  canOpenDraft?: (row: CourseTableRow) => boolean
  onOpenDraft?: (row: CourseTableRow) => void
}

/**
 * Renders the capstone courses list on top of the reusable `DataTable`.
 * Presentation-only - the page composing this component (issue #106) owns
 * fetching, filter/sort/search state, and pagination.
 *
 * Rows navigate to the course's page (`/courses/[courseId]`, still a
 * placeholder pending issue #108) via `getRowProps`'s `onClick`, skipping the
 * programmatic push when the click already landed on the course cell's real
 * `Link` (`isInteractiveDescendant`) to avoid a double navigation. Keyboard
 * users navigate through that link directly, so the row itself isn't made
 * focusable.
 *
 * A draft row the caller can open (`canOpenDraft`) calls `onOpenDraft` instead,
 * from both the row and its course cell, which becomes a button rather than a
 * link to a course page the draft doesn't have yet.
 */
export function CoursesTable({
  table,
  isLoading = false,
  emptyMessage = "No courses found.",
  density,
  striped,
  canOpenDraft,
  onOpenDraft,
}: CoursesTableProps) {
  const router = useRouter()

  if (isLoading) {
    return <CoursesTableSkeleton density={density} striped={striped} />
  }

  const draftOpener =
    canOpenDraft && onOpenDraft
      ? {
          canOpen: (row: CourseTableRow) => row.status === "draft" && canOpenDraft(row),
          open: onOpenDraft,
        }
      : null

  return (
    <OpenDraftCourseContext value={draftOpener}>
      <DataTable
        density={density}
        emptyMessage={emptyMessage}
        getRowProps={(row) => ({
          className: "cursor-pointer",
          onClick: (event) => {
            if (isInteractiveDescendant(event)) return
            if (draftOpener?.canOpen(row.original)) {
              draftOpener.open(row.original)
              return
            }
            router.push(rowHref(row.original))
          },
        })}
        scrollLabel={scrollLabel}
        striped={striped}
        table={table}
      />
    </OpenDraftCourseContext>
  )
}
