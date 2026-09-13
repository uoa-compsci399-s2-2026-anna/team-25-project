import type { CourseTableRow } from "./components/CoursesTable"

const CSV_COLUMNS: { key: keyof CourseTableRow; header: string }[] = [
  { key: "code", header: "Code" },
  { key: "title", header: "Title" },
  { key: "lecturer", header: "Lecturer" },
  { key: "university", header: "University" },
  { key: "semester", header: "Semester" },
  { key: "year", header: "Year" },
  { key: "status", header: "Status" },
]

// Spreadsheet apps treat a field starting with =, +, -, or @ as a formula
// when they open a CSV, and every field here is convenor-controlled free
// text, so a leading one gets neutralized with a `'`. After that, RFC 4180
// quoting wraps anything containing a comma, quote, or line break (\n or a
// bare \r), doubling up any quotes inside.
const escapeCsvField = (value: string | number): string => {
  const raw = String(value)
  const text = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const coursesToCsv = (rows: CourseTableRow[]): string => {
  const lines = [
    CSV_COLUMNS.map((column) => escapeCsvField(column.header)).join(","),
    ...rows.map((row) => CSV_COLUMNS.map((column) => escapeCsvField(row[column.key])).join(",")),
  ]
  // CRLF per RFC 4180, so the file opens cleanly in Excel too.
  return lines.join("\r\n")
}
