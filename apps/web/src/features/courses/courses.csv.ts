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

// RFC 4180: a field containing a comma, quote or newline is wrapped in
// quotes, with any quote inside it doubled.
const escapeCsvField = (value: string | number): string => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const coursesToCsv = (rows: CourseTableRow[]): string => {
  const lines = [
    CSV_COLUMNS.map((column) => escapeCsvField(column.header)).join(","),
    ...rows.map((row) => CSV_COLUMNS.map((column) => escapeCsvField(row[column.key])).join(",")),
  ]
  // CRLF per RFC 4180, so the file opens cleanly in Excel too.
  return lines.join("\r\n")
}
