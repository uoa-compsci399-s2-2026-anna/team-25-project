import { describe, expect, it } from "vitest"
import type { CourseTableRow } from "./components/CoursesTable"
import { coursesToCsv } from "./courses.csv"

const row = (overrides: Partial<CourseTableRow> = {}): CourseTableRow => ({
  id: "1",
  code: "COMP 693",
  title: "Capstone Project",
  lecturer: "A. Tui",
  university: "University of Auckland",
  semester: "Semester 2",
  year: 2026,
  status: "published",
  ...overrides,
})

describe("coursesToCsv", () => {
  it("writes a header row followed by one row per course", () => {
    const csv = coursesToCsv([row(), row({ id: "2", code: "SOFTENG 700", status: "draft" })])

    expect(csv.split("\r\n")).toEqual([
      "Code,Title,Lecturer,University,Semester,Year,Status",
      "COMP 693,Capstone Project,A. Tui,University of Auckland,Semester 2,2026,published",
      "SOFTENG 700,Capstone Project,A. Tui,University of Auckland,Semester 2,2026,draft",
    ])
  })

  it("writes just the header when there are no rows", () => {
    expect(coursesToCsv([])).toBe("Code,Title,Lecturer,University,Semester,Year,Status")
  })

  it("quotes a field containing a comma", () => {
    const csv = coursesToCsv([row({ title: "Capstone, Advanced" })])
    expect(csv).toContain('"Capstone, Advanced"')
  })

  it("quotes and doubles up embedded quotes", () => {
    const csv = coursesToCsv([row({ title: 'The "Capstone" Project' })])
    expect(csv).toContain('"The ""Capstone"" Project"')
  })

  it("quotes a field containing a newline", () => {
    const csv = coursesToCsv([row({ title: "Line one\nLine two" })])
    expect(csv).toContain('"Line one\nLine two"')
  })

  it("quotes a field containing a bare carriage return", () => {
    const csv = coursesToCsv([row({ title: "Line one\rLine two" })])
    expect(csv).toContain('"Line one\rLine two"')
  })

  it.each(["=1+1", "+1+1", "-1+1", "@TODAY()"])(
    "neutralizes a formula-triggering field %s with a leading apostrophe",
    (formula) => {
      const csv = coursesToCsv([row({ title: formula })])
      expect(csv).toContain(`'${formula}`)
    },
  )

  it("still quotes a neutralized formula field that also needs RFC 4180 escaping", () => {
    const csv = coursesToCsv([row({ title: '=HYPERLINK("https://evil.example","Click")' })])
    expect(csv).toContain('"\'=HYPERLINK(""https://evil.example"",""Click"")"')
  })
})
