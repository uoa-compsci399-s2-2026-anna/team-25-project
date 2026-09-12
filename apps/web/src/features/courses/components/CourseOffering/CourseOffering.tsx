import { RichText } from "@payloadcms/richtext-lexical/react"
import { CourseDeliveryFormatLabels } from "@repo/shared/enums/courses"
import type { CourseVersion } from "@repo/shared/payload-types"
import { Avatar, AvatarFallback, Heading, Separator, Skeleton } from "@repo/ui/components/ui"
import Link from "next/link"
import { Routes } from "@/lib/routes"
import { periodRange } from "../../courses.format"
import { type CourseRouteParams, parseCourseId } from "../../courses.params"
import { getPublishedOfferingsCached } from "../../courses.queries"
import {
  CourseOfferingDetail,
  CourseOfferingSection,
  CourseOfferingSidebarCard,
} from "./CourseOfferingPrimitives"

/**
 * Last two words, since these names usually carry a title ("Dr Anna Tui").
 * Spread so an astral-plane initial survives, and "?" so a blank name shows something.
 */
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => [...part].slice(0, 1).join(""))
    .join("")
    .toUpperCase() || "?"

// Aliased as the React compiler rule reads a capitalized call inside a component as
// a component rendered the wrong way.
const memberHref = Routes.MEMBERS.MEMBER

type SnapshotMember = NonNullable<
  NonNullable<CourseVersion["displaySnapshot"]>["teachingTeam"]
>[number]

/**
 * Links to the profile only when the snapshot recorded which member the name
 * belonged to. Offerings published before that was recorded, and any member since
 * removed, keep the published name as plain text.
 */
const TeamMember = ({ member }: { member: SnapshotMember }) => {
  const body = (
    <>
      <Avatar>
        <AvatarFallback>{initials(member.name ?? "")}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-sm group-hover:underline">{member.name}</p>
        {member.role && <p className="truncate text-muted-foreground text-xs">{member.role}</p>}
      </div>
    </>
  )

  const className = "group flex min-w-0 items-center gap-2"

  return member.memberId ? (
    <Link className={className} href={memberHref(member.memberId)}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

const richTextClassName =
  "flex flex-col gap-3 text-sm leading-relaxed [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"

export const CourseOffering = async ({ params }: { params: CourseRouteParams }) => {
  const courseId = await parseCourseId(params)

  const [offering, ...earlier] = await getPublishedOfferingsCached(courseId)

  // The header 404s a course with nothing published, so this is only reachable
  // mid-publication. Render nothing rather than taking down the header beside it.
  if (!offering) return null

  // Written at publication, so an old offering keeps the code and teaching team
  // it was published with rather than today's values. The header shows the
  // course's current identity, so the two can differ on an old period.
  const snapshot = offering.displaySnapshot
  const teachingTeam = (snapshot?.teachingTeam ?? []).filter((member) => member.name)
  return (
    <>
      <div className="mt-4 flex min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-3">
        {offering.name && <Heading level="h2">{offering.name}</Heading>}

        <Separator />

        {offering.learningOutcomes && (
          <CourseOfferingSection title="Learning outcomes">
            <RichText className={richTextClassName} data={offering.learningOutcomes} />
          </CourseOfferingSection>
        )}

        {offering.assessments && (
          <CourseOfferingSection title="Assessment">
            <RichText className={richTextClassName} data={offering.assessments} />
          </CourseOfferingSection>
        )}

        <Separator />

        <div className="grid gap-6 sm:grid-cols-3">
          <CourseOfferingDetail
            label="Teaching period"
            value={periodRange(offering) ?? offering.period}
          />
          {offering.deliveryFormat && (
            <CourseOfferingDetail
              label="Delivery"
              value={CourseDeliveryFormatLabels[offering.deliveryFormat]}
            />
          )}
          {offering.projectType && (
            <CourseOfferingDetail label="Project type" value={offering.projectType} />
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-4 lg:col-start-2 lg:row-span-3 lg:row-start-1">
        <CourseOfferingSidebarCard title="Offering">
          <CourseOfferingDetail label="Period" value={offering.period} />
          {offering.programme && (
            <CourseOfferingDetail label="Programme" value={offering.programme} />
          )}
          {snapshot?.courseCode && (
            <CourseOfferingDetail
              label="Published as"
              value={
                snapshot.institutionName
                  ? `${snapshot.courseCode} - ${snapshot.institutionName}`
                  : snapshot.courseCode
              }
            />
          )}
        </CourseOfferingSidebarCard>

        {teachingTeam.length > 0 && (
          <CourseOfferingSidebarCard title={`Teaching team - ${teachingTeam.length}`}>
            {teachingTeam.map((member) => (
              <TeamMember key={member.id ?? member.name} member={member} />
            ))}
          </CourseOfferingSidebarCard>
        )}

        {earlier.length > 0 && (
          <CourseOfferingSidebarCard title="Earlier offerings">
            {earlier.map((past) => (
              <div className="flex flex-col" key={past.id}>
                <p className="font-medium text-sm">{past.name ?? past.period}</p>
                <p className="text-muted-foreground text-xs">
                  {past.name ? `${past.period} - ` : ""}
                  {periodRange(past)}
                </p>
              </div>
            ))}
          </CourseOfferingSidebarCard>
        )}
      </aside>
    </>
  )
}

export const CourseOfferingSkeleton = () => (
  <>
    <div className="mt-4 flex flex-col gap-4 lg:col-start-1 lg:row-start-3">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-32 w-full" />
    </div>
    <Skeleton className="h-48 w-full lg:col-start-2 lg:row-span-3 lg:row-start-1" />
  </>
)
