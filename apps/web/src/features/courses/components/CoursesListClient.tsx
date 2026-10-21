"use client"

import { FilterBarSkeleton } from "@repo/ui/components/composite"
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react"
import type { EditableDraftCourse, MyDraftCourses } from "../courses.format"
import { EditDraftCourseDialog } from "./AddCourseDialog"
import {
  CoursesTable,
  CoursesTableSkeleton,
  type CourseTableRow,
  useCoursesTable,
} from "./CoursesTable"
import { CoursesToolbar, coursesFilterBarClassName } from "./CoursesToolbar"

const NO_DRAFTS: MyDraftCourses = { editable: {}, rows: [] }

// No default: a `ShareMyDraftCourses` outside a `CoursesListClient` has nowhere
// to send the drafts, and should fail loudly rather than drop them unseen.
const ReceiveMyDraftCoursesContext = createContext<((drafts: MyDraftCourses) => void) | null>(null)

/**
 * Hands the viewer's drafts to the enclosing `CoursesListClient`. Rendered from
 * inside the list's `draftsSlot`, so the drafts can stream in through their own
 * Suspense boundary while the table itself - and whatever the viewer has
 * already searched, filtered or sorted in it - stays mounted.
 */
export function ShareMyDraftCourses({ drafts }: { drafts: MyDraftCourses }) {
  const receive = useContext(ReceiveMyDraftCoursesContext)
  if (!receive) {
    throw new Error("ShareMyDraftCourses must be rendered inside a CoursesListClient's draftsSlot.")
  }
  useEffect(() => {
    receive(drafts)
  }, [drafts, receive])
  return null
}

export interface CoursesListClientProps {
  /** The published rows, the same for every viewer. */
  rows: CourseTableRow[]
  /**
   * Where the viewer's own drafts stream in from: a `ShareMyDraftCourses`,
   * usually behind a Suspense boundary. Renders nothing itself.
   */
  draftsSlot?: ReactNode
}

// Owns the table instance so the toolbar and the table share the same state.
// All rows load up front and get filtered/sorted in the browser -
// `pageSize: Infinity` opts out of pagination, since the design doesn't have
// any and the directory is small enough not to need it.
// On phones the table bleeds into the side padding so it can scroll to the
// screen edge; `--table-bleed` matches the `px-10` it bleeds through, and
// `--table-inset` sits it at half that from the edge, to fit more columns.
const listClassName =
  "flex w-full flex-col gap-4 px-10 py-6 max-md:[--table-bleed:--spacing(10)] max-md:[--table-inset:--spacing(5)] md:px-12"

export function CoursesListClient({ rows, draftsSlot }: CoursesListClientProps) {
  const [drafts, setDrafts] = useState(NO_DRAFTS)
  const allRows = useMemo(() => [...rows, ...drafts.rows], [rows, drafts])

  const table = useCoursesTable({
    data: allRows,
    initialState: { pagination: { pageIndex: 0, pageSize: Number.POSITIVE_INFINITY } },
  })

  // The draft being edited stays set after the dialog closes, so it can animate
  // out - and a draft just published drops out of `drafts` mid-close.
  // `openCount` remounts the dialog on every open, so it always starts from the
  // draft's latest saved values rather than a previous, cancelled edit.
  const [editing, setEditing] = useState<{ draft: EditableDraftCourse; openCount: number }>()
  const [editorOpen, setEditorOpen] = useState(false)

  return (
    <div className={listClassName}>
      <ReceiveMyDraftCoursesContext value={setDrafts}>{draftsSlot}</ReceiveMyDraftCoursesContext>
      <CoursesToolbar rows={allRows} table={table} />
      <CoursesTable
        canOpenDraft={(row) => Object.hasOwn(drafts.editable, row.id)}
        emptyMessage="No courses match these filters."
        onOpenDraft={(row) => {
          setEditing((current) => ({
            draft: drafts.editable[row.id],
            openCount: (current?.openCount ?? 0) + 1,
          }))
          setEditorOpen(true)
        }}
        table={table}
      />
      {editing && (
        <EditDraftCourseDialog
          draft={editing.draft}
          key={editing.openCount}
          onOpenChange={setEditorOpen}
          open={editorOpen}
        />
      )}
    </div>
  )
}

export function CoursesListClientSkeleton() {
  return (
    <div className={listClassName}>
      <FilterBarSkeleton
        className={coursesFilterBarClassName}
        filterCount={3}
        groupControls
        statusCount={3}
      />
      <CoursesTableSkeleton />
    </div>
  )
}
