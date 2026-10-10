import { toast } from "@repo/ui/components/ui"
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createCourse } from "../actions/createCourse"
import { updateDraftCourse } from "../actions/updateDraftCourse"
import type { MyDraftCourses } from "../courses.format"
import {
  CoursesListClient,
  CoursesListClientSkeleton,
  ShareMyDraftCourses,
} from "./CoursesListClient"
import type { CourseTableRow } from "./CoursesTable"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("../actions/createCourse", () => ({ createCourse: vi.fn() }))
vi.mock("../actions/updateDraftCourse", () => ({ updateDraftCourse: vi.fn() }))

const rows: Array<CourseTableRow> = Array.from({ length: 15 }, (_, index) => ({
  id: String(index + 1),
  code: `COMP ${600 + index}`,
  title: "Capstone Project",
  lecturer: "A. Tui",
  university: "University of Auckland",
  semester: "Semester 2",
  year: 2026,
  status: "published",
}))

describe("CoursesListClient", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows every row up front, with no pagination limiting the table", () => {
    render(<CoursesListClient rows={rows} />)

    const bodyRows = within(screen.getAllByRole("rowgroup")[1]).getAllByRole("row")
    expect(bodyRows).toHaveLength(15)
  })

  it("renders the toolbar wired to the same table as the list", () => {
    render(<CoursesListClient rows={rows} />)

    expect(screen.getByRole("searchbox", { name: "Search courses..." })).toBeInTheDocument()
  })

  it("shows the empty message when no courses are passed in", () => {
    render(<CoursesListClient rows={[]} />)

    expect(screen.getByText("No courses match these filters.")).toBeInTheDocument()
  })
})

describe("CoursesListClient drafts", () => {
  const draftRow: CourseTableRow = {
    id: "4",
    code: "COSC 345",
    title: "Draft capstone",
    lecturer: "A. Tui",
    university: "University of Otago",
    semester: "Semester 2",
    year: 2026,
    status: "draft",
  }

  const drafts: MyDraftCourses = {
    rows: [draftRow],
    editable: {
      "4": {
        courseId: 4,
        versionId: 9,
        values: {
          additionalInfo: null,
          assessments: null,
          code: "COSC 345",
          deliveryFormat: "",
          endDate: "",
          learningOutcomes: null,
          name: "Draft capstone",
          period: "2026 Semester 2",
          programme: "",
          projectType: "",
          role: "Senior Lecturer",
          startDate: "",
        },
      },
    },
  }

  const renderWithDrafts = () =>
    render(<CoursesListClient draftsSlot={<ShareMyDraftCourses drafts={drafts} />} rows={[]} />)

  const openDraft = () =>
    fireEvent.click(screen.getByRole("button", { name: "COSC 345 Draft capstoneA. Tui" }))

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    act(() => {
      toast.close()
    })
  })

  it("adds the drafts to the table without resetting a search already typed into it", () => {
    const { rerender } = render(<CoursesListClient rows={rows} />)
    fireEvent.change(screen.getByRole("searchbox", { name: "Search courses..." }), {
      target: { value: "COSC" },
    })

    rerender(<CoursesListClient draftsSlot={<ShareMyDraftCourses drafts={drafts} />} rows={rows} />)

    expect(screen.getByRole("searchbox", { name: "Search courses..." })).toHaveValue("COSC")
    const bodyRows = within(screen.getAllByRole("rowgroup")[1]).getAllByRole("row")
    expect(bodyRows).toHaveLength(1)
    expect(screen.getByText("COSC 345 Draft capstone")).toBeInTheDocument()
  })

  it("throws when drafts are shared outside a CoursesListClient, rather than dropping them", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<ShareMyDraftCourses drafts={drafts} />)).toThrow(
      "ShareMyDraftCourses must be rendered inside a CoursesListClient's draftsSlot.",
    )
  })

  it("opens the dialog pre-filled with the draft's saved values", () => {
    renderWithDrafts()

    openDraft()

    expect(screen.getByRole("dialog", { name: "Edit draft course" })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Course code/)).toHaveValue("COSC 345")
    expect(screen.getByLabelText(/^Course name/)).toHaveValue("Draft capstone")
    expect(screen.getByLabelText(/^Teaching period/)).toHaveValue("2026 Semester 2")
    expect(screen.getByLabelText(/^Your role/)).toHaveValue("Senior Lecturer")
  })

  it("saves over the selected draft instead of creating a new one", async () => {
    vi.mocked(updateDraftCourse).mockResolvedValue({ ok: true })
    renderWithDrafts()

    openDraft()
    fireEvent.change(screen.getByLabelText(/^Course name/), { target: { value: "Renamed" } })
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }))

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
    expect(updateDraftCourse).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 4, intent: "draft", name: "Renamed", versionId: 9 }),
    )
    expect(createCourse).not.toHaveBeenCalled()
  })

  it("publishes the selected draft from Publish", async () => {
    vi.mocked(updateDraftCourse).mockResolvedValue({ ok: true })
    renderWithDrafts()

    openDraft()
    fireEvent.click(screen.getByRole("button", { name: "Publish" }))

    await waitFor(() => {
      expect(updateDraftCourse).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: 4, intent: "publish", versionId: 9 }),
      )
    })
  })

  it("keeps the dialog open with the error when saving fails", async () => {
    vi.mocked(updateDraftCourse).mockResolvedValue({
      formError: "This course has already been published.",
      ok: false,
    })
    renderWithDrafts()

    openDraft()
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }))

    expect(await screen.findByText("This course has already been published.")).toBeInTheDocument()
    expect(screen.getByRole("dialog", { name: "Edit draft course" })).toBeInTheDocument()
  })

  it("drops unsaved edits when the draft is closed and reopened", async () => {
    renderWithDrafts()

    openDraft()
    fireEvent.change(screen.getByLabelText(/^Course name/), { target: { value: "Unsaved" } })
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    openDraft()
    expect(screen.getByLabelText(/^Course name/)).toHaveValue("Draft capstone")
  })
})

describe("CoursesListClientSkeleton", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders a filter bar placeholder with the toolbar's three filters and status tabs", () => {
    const { container } = render(<CoursesListClientSkeleton />)

    expect(container.querySelector('[data-slot="filter-bar-skeleton-status"]')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="filter-bar-skeleton-filter"]')).toHaveLength(3)
  })

  it("renders the table's real column headers above placeholder rows", () => {
    render(<CoursesListClientSkeleton />)

    expect(screen.getByRole("columnheader", { name: "Course" })).toBeInTheDocument()
    expect(within(screen.getAllByRole("rowgroup")[1]).getAllByRole("row").length).toBeGreaterThan(0)
  })
})
