import { CourseDeliveryFormatLabels } from "@repo/shared/enums/courses"
import type { CourseVersion } from "@repo/shared/payload-types"
import { richTextHasText } from "@repo/shared/schemas/shared"
import { initialsFromName } from "@repo/shared/utils/initials"
import { CourseOfferingList } from "@repo/ui/components/composite"
import { Avatar, AvatarFallback, Heading, Separator, Skeleton } from "@repo/ui/components/ui"
import Link from "next/link"
import { RichTextContent } from "@/components/RichTextContent"
import { StringHrefLink } from "@/components/StringHrefLink"
import { Routes } from "@/lib/routes"
import { offeringPeriod, periodRange } from "../../courses.format"
import { offeringTiming } from "../../courses.offerings"
import type { CourseRouteParams, CourseRouteSearchParams } from "../../courses.params"
import { resolveCourseOffering } from "../../courses.queries"
import {
  CourseOfferingDetail,
  CourseOfferingSection,
  CourseOfferingSidebarCard,
} from "./CourseOfferingPrimitives"

// Aliased as the React compiler rule reads a capitalized call inside a component as
// a component rendered the wrong way.
const memberHref = Routes.MEMBERS.MEMBER
const offeringHref = Routes.COURSES.OFFERING

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
        <AvatarFallback>{initialsFromName(member.name ?? "")}</AvatarFallback>
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

export const CourseOffering = async ({
  params,
  searchParams,
}: {
  params: CourseRouteParams
  searchParams: CourseRouteSearchParams
}) => {
  const {
    courseId,
    now,
    offerings,
    selected: offering,
    current,
  } = await resolveCourseOffering(params, searchParams)

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
            <RichTextContent className="text-sm" data={offering.learningOutcomes} />
          </CourseOfferingSection>
        )}

        {offering.assessments && (
          <CourseOfferingSection title="Assessment">
            <RichTextContent className="text-sm" data={offering.assessments} />
          </CourseOfferingSection>
        )}

        {offering.additionalInfo && richTextHasText(offering.additionalInfo.root) && (
          <CourseOfferingSection title="Additional information">
            <RichTextContent className="text-sm" data={offering.additionalInfo} />
          </CourseOfferingSection>
        )}

        <Separator />

        <div className="grid gap-6 sm:grid-cols-3">
          <CourseOfferingDetail
            label="Teaching period"
            value={periodRange(offering) ?? offeringPeriod(offering)}
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

      <aside className="mt-2 flex flex-col gap-4 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:mt-0">
        {teachingTeam.length > 0 && (
          <CourseOfferingSidebarCard title={`Teaching team - ${teachingTeam.length}`}>
            {teachingTeam.map((member) => (
              <TeamMember key={member.id ?? member.name} member={member} />
            ))}
          </CourseOfferingSidebarCard>
        )}

        <CourseOfferingSidebarCard title="Offering">
          <CourseOfferingDetail label="Period" value={offeringPeriod(offering)} />
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

        {offerings.length > 1 && (
          <CourseOfferingSidebarCard title={`Offerings - ${offerings.length}`}>
            <CourseOfferingList
              items={offerings.map((other) => ({
                id: other.id,
                period: offeringPeriod(other),
                timing: offeringTiming(other, now),
                href: offeringHref(courseId, other.id, current.id),
                // Names only differ between offerings when a course is renamed, so the
                // name is only worth repeating when it isn't this one's.
                detail: [other.name !== offering.name && other.name, periodRange(other)]
                  .filter(Boolean)
                  .join(" - "),
              }))}
              linkComponent={StringHrefLink}
              selectedId={offering.id}
            />
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
    <Skeleton className="mt-2 h-48 w-full lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:mt-0" />
  </>
)
