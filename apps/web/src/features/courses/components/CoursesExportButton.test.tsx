import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CoursesExportButton } from "./CoursesExportButton"
import type { CourseTableRow } from "./CoursesTable"

const courses: Array<CourseTableRow> = [
  {
    id: "1",
    code: "COMP 693",
    title: "Capstone Project",
    lecturer: "A. Tui",
    university: "University of Auckland",
    semester: "Semester 2",
    year: 2026,
    status: "published",
  },
  {
    id: "2",
    code: "SOFTENG 700",
    title: "Research Project",
    lecturer: "M. Rahman",
    university: "University of Auckland",
    semester: "Semester 1",
    year: 2027,
    status: "draft",
  },
]

describe("CoursesExportButton", () => {
  let clickSpy: ReturnType<typeof vi.spyOn>
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>
  let blobSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
    createObjectURL = vi.fn(() => "blob:mock-url")
    revokeObjectURL = vi.fn()
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL })

    // jsdom's Blob doesn't reliably support `.text()`, so capture the raw
    // parts/options passed to the constructor instead of reading it back.
    // Must be a real `function` (not an arrow) since `new Blob(...)` invokes it as a constructor.
    blobSpy = vi.fn(function Blob(parts: BlobPart[], options?: BlobPropertyBag) {
      return { parts, type: options?.type }
    })
    vi.stubGlobal("Blob", blobSpy)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    clickSpy.mockRestore()
  })

  it("downloads a CSV of every course it's given", async () => {
    const user = userEvent.setup()
    render(<CoursesExportButton rows={courses} />)

    await user.click(screen.getByRole("button", { name: "Export CSV" }))

    expect(blobSpy).toHaveBeenCalledWith([expect.any(String)], {
      type: "text/csv;charset=utf-8;",
    })
    const [[csv]] = blobSpy.mock.calls[0]
    expect(csv.split("\r\n")).toEqual([
      "Code,Title,Lecturer,University,Semester,Year,Status",
      "COMP 693,Capstone Project,A. Tui,University of Auckland,Semester 2,2026,published",
      "SOFTENG 700,Research Project,M. Rahman,University of Auckland,Semester 1,2027,draft",
    ])

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url")
  })
})
