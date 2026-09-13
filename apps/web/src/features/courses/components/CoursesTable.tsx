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
import { constructFilterFn, createColumnHelper, filterFn_arrHas } from "@tanstack/react-table"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Routes } from "@/lib/routes"

/**
 * `duration`, `students`, `teamSize`, and `industry` were dropped: none have
 * a backing field in `Course`/`CourseVersion` (see PR description).
 *
 * `semester`/`year` are derived by splitting `CourseVersion.period` (e.g.
 * "2026 Semester 2") - no other part of the app does this split, so whoever
 * wires the real Course/CourseVersion join (#106) will need to derive them
 * from `period` the same way.
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
}

// `arrHas` compares with `===`, so a numeric column needs both sides coerced
// to the same type to match string filter values (e.g. from a URL/filter UI).
const arrHasNumeric = constructFilterFn({
  ...filterFn_arrHas,
  resolveDataValue: (value: unknown) => String(value),
  resolveFilterValue: (value: unknown) => (Array.isArray(value) ? value.map(String) : value),
})

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
    filterFn: "arrHas",
    cell: ({ getValue }) => <TextCell tone="muted">{getValue()}</TextCell>,
  }),
  helper.accessor("year", {
    header: ({ column }) => <SortableHeader column={column}>Year</SortableHeader>,
    filterFn: arrHasNumeric,
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
 * Presentation-only - the page composing this component (issue #106) owns
 * fetching, filter/sort/search state, and pagination.
 *
 * Rows navigate to the course's page (`/courses/[courseId]`, still a
 * placeholder pending issue #108) via `getRowProps`'s `onClick`, skipping the
 * programmatic push when the click already landed on the course cell's real
 * `Link` (`isInteractiveDescendant`) to avoid a double navigation. Keyboard
 * users navigate through that link directly, so the row itself isn't made
 * focusable.
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
      getRowProps={(row) => ({
        className: "cursor-pointer",
        onClick: (event) => {
          if (isInteractiveDescendant(event)) return
          router.push(Routes.COURSES.COURSE(row.original.id))
        },
      })}
      striped={striped}
      table={table}
    />
  )
}
