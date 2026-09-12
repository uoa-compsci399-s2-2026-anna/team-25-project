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
import { Routes } from "@/lib/routes"

/**
 * The row shape `CoursesTable` renders. `Course` and `CourseVersion` are
 * separate Payload collections with no join between them yet - producing
 * this shape (and pagination) is issue #106's job, not this component's.
 *
 * `duration`, `students`, `teamSize`, and `industry` (involvement) were
 * dropped from the Figma-derived column set: none of them have a backing
 * field anywhere in `Course`/`CourseVersion` (verified against
 * `packages/shared/src/payload-types.ts` and the collection configs - the
 * only "industry" in the schema is an unrelated `Proposal` tag). Re-add
 * them once a backend field exists for each; see the PR description.
 *
 * `semester`/`year` are derived by splitting `CourseVersion.period` (e.g.
 * "2026 Semester 2"), which no other part of the app does - everywhere
 * else (`courses.format.ts`, `CourseOfferingMeta`) treats `period` as one
 * opaque display string. This split is a `CoursesTable`-only convenience
 * for sorting/filtering by year; whoever wires the real join (#106) will
 * need to derive it from `period` the same way, since Payload does not
 * store them as separate fields.
 */
export interface CourseTableRow {
  id: string
  code: string
  title: string
  /** A single display name, e.g. the course coordinator - not the full
   * teaching team (`CourseVersion.displaySnapshot.teachingTeam` is a list
   * of `{ name, role }`). A table cell needs one line; whoever produces
   * this row picks which name represents the course. */
  lecturer: string
  university: string
  semester: string
  year: number
  status: "draft" | "published"
}

const statusLabels = {
  draft: "Draft",
  published: "Published",
} as const

const statusVariants = {
  draft: "secondary",
  published: "blue",
} as const

const helper = createColumnHelper<DataTableFeatures, CourseTableRow>()

export const courseColumns = helper.columns([
  helper.accessor((row) => `${row.code} ${row.title}`, {
    id: "course",
    filterFn: "includesString",
    header: ({ column }) => <SortableHeader column={column}>Course</SortableHeader>,
    cell: ({ getValue, row }) => (
      <Link
        className="block rounded-sm focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        href={Routes.COURSES.COURSE(row.original.id)}
      >
        <StackedCell primary={getValue()} secondary={row.original.lecturer} />
      </Link>
    ),
  }),
  helper.accessor("university", {
    header: ({ column }) => <SortableHeader column={column}>University</SortableHeader>,
    filterFn: "arrHas",
    cell: ({ getValue }) => <TextCell tone="muted">{getValue()}</TextCell>,
  }),
  helper.accessor("semester", {
    header: ({ column }) => <SortableHeader column={column}>Semester</SortableHeader>,
    cell: ({ getValue }) => <TextCell tone="muted">{getValue()}</TextCell>,
  }),
  helper.accessor("year", {
    header: ({ column }) => <SortableHeader column={column}>Year</SortableHeader>,
    filterFn: "arrHas",
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

// Plain-text mirror of each column's header label, in the same order as
// `courseColumns`, for the loading skeleton below - the column labels are
// static and known immediately, so there's no reason to skeleton-ize them
// along with the data. Kept as a plain array rather than keyed by column id:
// TanStack only resolves `id` from `accessorKey` on runtime `Column`
// instances, not on the static `ColumnDef`s in `courseColumns` itself.
const courseColumnLabels = ["Course", "University", "Semester", "Year", "Status"] as const

type UseCoursesTableOptions = Omit<UseDataTableOptions<CourseTableRow>, "columns">

/**
 * Thin preset over `useDataTable` pinned to the course columns above, kept
 * separate from `CoursesTable` for the same reason `useDataTable`/`DataTable`
 * are split: a future filter bar can share this table instance and drive it
 * via `table.getColumn(id).setFilterValue(...)`, without `CoursesTable`
 * needing to know about that UI.
 */
export function useCoursesTable(options: UseCoursesTableOptions) {
  return useDataTable({ columns: courseColumns, ...options })
}

export type CoursesTableInstance = DataTableInstance<CourseTableRow>

const SKELETON_ROW_COUNT = 8
// Stable per-row identity for the placeholder rows below, since they have no
// underlying data of their own to key off.
const skeletonRowIds = Array.from({ length: SKELETON_ROW_COUNT }, () => crypto.randomUUID())

function CoursesTableSkeleton({ density, striped }: TableVariantProps) {
  return (
    <Table density={density} striped={striped}>
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
}

/**
 * Renders the capstone courses list on top of the reusable `DataTable`.
 * Presentation-only: it does not fetch data, own filter/sort/search state,
 * or paginate - the page composing this component (issue #106) owns all of
 * that and drives this table through the shared instance from
 * `useCoursesTable`.
 *
 * Rows navigate to the course's individual page (`/courses/[courseId]`,
 * still a placeholder pending issue #108). The course cell renders a real
 * `Link` for accessibility/middle-click; `getRowProps` makes the rest of the
 * row clickable too (mouse click, and keyboard Enter/Space once the row is
 * focused via `tabIndex`), skipping the programmatic navigation when the
 * event already landed on that real link (`isInteractiveDescendant`) to
 * avoid a double navigation.
 */
export function CoursesTable({
  table,
  isLoading = false,
  emptyMessage = "No courses found.",
  density,
  striped,
}: CoursesTableProps) {
  const router = useRouter()

  if (isLoading) {
    return <CoursesTableSkeleton density={density} striped={striped} />
  }

  return (
    <DataTable
      density={density}
      emptyMessage={emptyMessage}
      getRowProps={(row) => {
        const navigate = () => router.push(Routes.COURSES.COURSE(row.original.id))
        return {
          className: "cursor-pointer",
          onClick: (event) => {
            if (isInteractiveDescendant(event)) return
            navigate()
          },
          onKeyDown: (event) => {
            if (isInteractiveDescendant(event)) return
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              navigate()
            }
          },
          tabIndex: 0,
        }
      }}
      striped={striped}
      table={table}
    />
  )
}
