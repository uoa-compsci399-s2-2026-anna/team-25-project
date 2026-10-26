import { Badge, Card, CardContent, Eyebrow, Skeleton } from "@repo/ui/components/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { Routes } from "@/lib/routes"
import type { MyCourse, MyCoursesSummary } from "../courses.format"

export interface YourCoursesPanelProps {
  /** `null` covers both nobody being signed in and a signed-in admin, who has no courses of their own. */
  myCourses: MyCoursesSummary | null
}

const MAX_TAUGHT_PERIODS = 2

const linkClassName = "underline-offset-4 hover:underline"

function TaughtOfferings({ course }: { course: MyCourse }) {
  const shown = course.taughtOfferings.slice(0, MAX_TAUGHT_PERIODS)
  const hidden = course.taughtOfferings.length - shown.length
  return (
    <p className="text-muted-foreground">
      Taught{" "}
      {shown.map((offering, index) => (
        <span key={offering.id}>
          {index > 0 && ", "}
          <Link
            className={linkClassName}
            href={Routes.COURSES.COURSE(course.courseId, offering.id)}
          >
            {offering.period}
          </Link>
        </span>
      ))}
      {hidden > 0 && ` +${hidden}`}
    </p>
  )
}

function CourseDetail({ course, year }: { course: MyCourse; year: number }) {
  if (course.needsOfferingThisYear) {
    return (
      <p className="text-destructive">
        Needs a {year} offering
        {course.lastOfferingBeforeYear && ` · last ${course.lastOfferingBeforeYear}`}
      </p>
    )
  }
  if (course.taughtOfferings.length > 0) return <TaughtOfferings course={course} />
  return <p className="text-muted-foreground">Current offering {course.currentOffering}</p>
}

const tileClassName = "flex flex-col gap-1 rounded-lg border bg-background p-4"

function CourseTile({ course, year }: { course: MyCourse; year: number }) {
  return (
    <li className={tileClassName}>
      <div className="flex items-start justify-between gap-2">
        <Link
          className={`line-clamp-2 min-w-0 flex-1 font-medium ${linkClassName}`}
          href={Routes.COURSES.COURSE(course.courseId)}
        >
          {course.code} {course.title}
        </Link>
        <div className="flex shrink-0 gap-1">
          {course.isOwner && <Badge variant="pink">Owner</Badge>}
          {course.isEditor && <Badge variant="blue">Editor</Badge>}
        </div>
      </div>
      <CourseDetail course={course} year={year} />
    </li>
  )
}

function PanelFrame({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <div className="w-full px-10 pt-6 pb-10 md:px-12">
      <Card>
        <CardContent className="w-full gap-3">
          <div className="flex flex-col gap-1">
            <Eyebrow>Your courses</Eyebrow>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
          <ul className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {children}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

// Owned courses only: they're the ones the viewer has to keep up to date.
const ownedStatus = ({ courses }: MyCoursesSummary) => {
  const owned = courses.filter((course) => course.isOwner).length
  if (owned === 0) return undefined
  const needsOffering = courses.filter((course) => course.needsOfferingThisYear).length
  const ownedText = `You own ${owned} course${owned === 1 ? "" : "s"}`
  if (needsOffering === 0) {
    return owned === 1
      ? `${ownedText}, and it's up to date.`
      : `${ownedText}, and all are up to date.`
  }
  return `${ownedText}. ${needsOffering} ${needsOffering === 1 ? "needs" : "need"} updating.`
}

// Renders nothing rather than an empty state: the page header already offers to add a course.
export function YourCoursesPanel({ myCourses }: YourCoursesPanelProps) {
  if (!myCourses || myCourses.courses.length === 0) return null

  return (
    <PanelFrame subtitle={ownedStatus(myCourses)}>
      {myCourses.courses.map((course) => (
        <CourseTile course={course} key={course.courseId} year={myCourses.year} />
      ))}
    </PanelFrame>
  )
}

const SKELETON_TILES = 3

// Shown while `getMyCoursesSummary` - dynamic and per-viewer - is still streaming in.
export function YourCoursesPanelSkeleton() {
  return (
    <PanelFrame>
      {Array.from({ length: SKELETON_TILES }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholders never reorder
        <li className={tileClassName} key={index}>
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-12 rounded-4xl" />
          </div>
          <Skeleton className="h-4 w-1/2" />
        </li>
      ))}
    </PanelFrame>
  )
}
