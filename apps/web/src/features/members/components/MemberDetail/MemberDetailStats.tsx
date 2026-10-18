import { RESEARCH_INTEREST_MAX_LENGTH, RESEARCH_INTERESTS_MAX } from "@repo/shared/schemas/register"
import { Badge, Card, CardContent, CardHeader, Skeleton } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import Link from "next/link"
import type { ReactNode } from "react"
import { formatDate } from "@/features/courses/courses.format"
import { Routes } from "@/lib/routes"
import { type MembersRouteParams, parseMemberId } from "../../members.params"
import { getMemberCoursesCached, getMemberDetailsCached } from "../../members.queries"
import { MemberEdit } from "../MemberEditor/memberEditFields"
import { mobileSection } from "./mobileSection"

// A sidebar card on wide screens; on phones a plain section like the rest of the profile.
// The phone label copies Heading's h2 look, text-black included, so it matches the other
// section headings rather than the greyer foreground token.
const StatCard = ({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) => (
  <Card
    className={cn(
      "max-md:gap-4 max-md:rounded-none max-md:bg-transparent max-md:ring-0",
      mobileSection,
      className,
    )}
  >
    <CardHeader className="max-md:px-0">
      <span className="text-muted-foreground text-xs uppercase tracking-wide max-md:font-heading max-md:font-semibold max-md:text-2xl max-md:text-black max-md:normal-case max-md:tracking-[-0.04em]">
        {label}
      </span>
    </CardHeader>
    <CardContent className="max-md:px-0">{children}</CardContent>
  </Card>
)

export const MemberStats = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const [member, courses] = await Promise.all([
    getMemberDetailsCached(memberId),
    getMemberCoursesCached(memberId),
  ])

  if (!member) return null
  const memberSince = formatDate(member.registrationCompletedAt ?? member.createdAt)

  return (
    <div className="flex flex-col gap-4 max-md:contents">
      <StatCard className="max-md:order-6" label="Courses convened">
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
                  <div className="flex items-center justify-between gap-3 text-muted-foreground text-xs max-md:justify-start max-md:gap-1.5 max-md:text-base max-md:text-foreground">
                    {course.code && (
                      <span className="font-medium group-hover:underline max-md:font-normal">
                        {course.code}
                      </span>
                    )}
                    {course.name && (
                      <span className="text-muted-foreground text-sm max-md:text-base max-md:text-foreground">
                        {course.name}
                      </span>
                    )}
                  </div>
                  <span className="max-md:text-muted-foreground">{course.period}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </StatCard>
      <StatCard className="max-md:order-8" label="Research interests">
        <MemberEdit.TagList
          itemLabel="research interest"
          label="Research interests"
          max={RESEARCH_INTERESTS_MAX}
          maxLength={RESEARCH_INTEREST_MAX_LENGTH}
          name="researchInterests"
          value={member.researchInterests}
          view={
            member.researchInterests?.length ? (
              <ul className="flex flex-wrap gap-1">
                {member.researchInterests.map((interest) => (
                  <li key={interest}>
                    <Badge>{interest}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-muted-foreground">No interests yet.</span>
            )
          }
        />
      </StatCard>
      {memberSince && (
        <StatCard className="max-md:order-9" label="Member since">
          <span className="font-medium">{memberSince}</span>
        </StatCard>
      )}
    </div>
  )
}

// One placeholder per card, each at its card's phone position, so nothing shifts on load.
export const MemberStatsSkeleton = () => (
  <div className="flex flex-col gap-4 max-md:contents">
    <div className={cn("max-md:order-6", mobileSection)}>
      <Skeleton className="h-36 w-full" />
    </div>
    <div className={cn("max-md:order-8", mobileSection)}>
      <Skeleton className="h-20 w-full" />
    </div>
    <div className={cn("max-md:order-9", mobileSection)}>
      <Skeleton className="h-20 w-full" />
    </div>
  </div>
)
