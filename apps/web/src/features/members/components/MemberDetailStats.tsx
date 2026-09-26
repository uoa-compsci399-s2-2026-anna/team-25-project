import { Badge, Card, CardContent, CardHeader, Skeleton } from "@repo/ui/components/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { formatDate } from "@/features/courses/courses.format"
import { Routes } from "@/lib/routes"
import { type MembersRouteParams, parseMemberId } from "../members.params"
import { getMemberCoursesCached, getMemberDetailsCached } from "../members.queries"

const StatCard = ({ label, children }: { label: string; children: ReactNode }) => (
  <Card>
    <CardHeader>
      <span className="text-muted-foreground text-xs uppercase tracking-wide">{label}</span>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
)

export const MemberStats = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const [member, courses] = await Promise.all([
    getMemberDetailsCached(memberId),
    getMemberCoursesCached(memberId),
  ])
  // The header 404s a missing member, so there's nothing to show here.
  if (!member) return null

  const memberSince = formatDate(member.registrationCompletedAt ?? member.createdAt)

  return (
    <div className="flex flex-col gap-4">
      <StatCard label="Courses convened">
        {courses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No courses yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {courses.map((course) => (
              <li className="py-3 first:pt-0 last:pb-0" key={course.courseId}>
                <Link
                  className="group flex flex-col gap-0.5"
                  href={Routes.COURSES.COURSE(String(course.courseId))}
                >
                  <div className="flex items-center justify-between gap-3 text-muted-foreground text-xs">
                    {course.code && (
                      <span className="font-medium group-hover:underline">{course.code}</span>
                    )}
                    {course.name && (
                      <span className="text-muted-foreground text-sm">{course.name}</span>
                    )}
                  </div>
                  <span>{course.period}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </StatCard>
      <StatCard label="Research interests">
        {member.researchInterests?.length ? (
          <ul className="flex flex-wrap gap-1">
            {member.researchInterests.map((interest) => (
              <li key={interest}>
                <Badge>{interest}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-muted-foreground">Not added yet</span>
        )}
      </StatCard>
      {memberSince && (
        <StatCard label="Member since">
          <span className="font-medium">{memberSince}</span>
        </StatCard>
      )}
    </div>
  )
}

export const MemberStatsSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="h-36 w-full" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
  </div>
)
