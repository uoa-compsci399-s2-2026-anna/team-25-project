import { Card, CardContent, Eyebrow, Skeleton } from "@repo/ui/components/ui"
import type { CoursesSummaryStats } from "../courses.format"

export interface CoursesSummaryPanelProps {
  summary: CoursesSummaryStats
}

const summaryRows = ({
  totalCourses,
  yearLongCourses,
  industryRequiredCourses,
  medianTeamSize,
}: CoursesSummaryStats) => [
  { label: "Year-long courses", value: `${yearLongCourses} of ${totalCourses}` },
  { label: "Industry required", value: `${industryRequiredCourses} of ${totalCourses}` },
  { label: "Median team size", value: String(medianTeamSize) },
]

export function CoursesSummaryPanel({ summary }: CoursesSummaryPanelProps) {
  return (
    <Card>
      <CardContent className="w-full gap-3">
        <Eyebrow>Summary</Eyebrow>
        <dl className="flex w-full flex-col gap-2">
          {summaryRows(summary).map((row) => (
            <div className="flex items-center justify-between gap-4" key={row.label}>
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

const summaryLabels = ["Year-long courses", "Industry required", "Median team size"] as const

// The labels are fixed, so only the values wait.
export function CoursesSummaryPanelSkeleton() {
  return (
    <Card>
      <CardContent className="w-full gap-3">
        <Eyebrow>Summary</Eyebrow>
        <dl className="flex w-full flex-col gap-2">
          {summaryLabels.map((label) => (
            <div className="flex items-center justify-between gap-4" key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd>
                <Skeleton className="h-4 w-12" />
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
