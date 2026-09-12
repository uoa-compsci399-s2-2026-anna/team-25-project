import { RichText } from "@payloadcms/richtext-lexical/react"
import { CourseDeliveryFormatLabels } from "@repo/shared/enums/courses"
import type { CourseVersion } from "@repo/shared/payload-types"
import {
  Avatar,
  AvatarFallback,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Heading,
  Separator,
  Skeleton,
} from "@repo/ui/components/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { Routes } from "@/lib/routes"
import { periodRange } from "../courses.format"
import { type CourseRouteParams, parseCourseId } from "../courses.params"
import { getPublishedOfferingsCached } from "../courses.queries"

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

const labelClassName = "font-semibold text-muted-foreground text-xs uppercase tracking-widest"

const Section = ({ children, title }: { children: ReactNode; title: string }) => (
  <section className="flex flex-col gap-2">
    <h3 className={labelClassName}>{title}</h3>
    {children}
  </section>
)

const Detail = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <p className={labelClassName}>{label}</p>
    <p className="text-sm">{value}</p>
  </div>
)

const SidebarCard = ({ children, title }: { children: ReactNode; title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className={labelClassName}>{title}</CardTitle>
    </CardHeader>
    <CardContent className="gap-3 self-stretch">{children}</CardContent>
  </Card>
)

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
          <Section title="Learning outcomes">
            <RichText className={richTextClassName} data={offering.learningOutcomes} />
          </Section>
        )}

        {offering.assessments && (
          <Section title="Assessment">
            <RichText className={richTextClassName} data={offering.assessments} />
          </Section>
        )}

        <Separator />

        <div className="grid gap-6 sm:grid-cols-3">
          <Detail label="Teaching period" value={periodRange(offering) ?? offering.period} />
          {offering.deliveryFormat && (
            <Detail label="Delivery" value={CourseDeliveryFormatLabels[offering.deliveryFormat]} />
          )}
          {offering.projectType && <Detail label="Project type" value={offering.projectType} />}
        </div>
      </div>

      <aside className="flex flex-col gap-4 lg:col-start-2 lg:row-span-3 lg:row-start-1">
        <SidebarCard title="Offering">
          <Detail label="Period" value={offering.period} />
          {offering.programme && <Detail label="Programme" value={offering.programme} />}
          {snapshot?.courseCode && (
            <Detail
              label="Published as"
              value={
                snapshot.institutionName
                  ? `${snapshot.courseCode} - ${snapshot.institutionName}`
                  : snapshot.courseCode
              }
            />
          )}
        </SidebarCard>

        {teachingTeam.length > 0 && (
          <SidebarCard title={`Teaching team - ${teachingTeam.length}`}>
            {teachingTeam.map((member) => (
              <TeamMember key={member.id ?? member.name} member={member} />
            ))}
          </SidebarCard>
        )}

        {earlier.length > 0 && (
          <SidebarCard title="Earlier offerings">
            {earlier.map((past) => (
              <div className="flex flex-col" key={past.id}>
                <p className="font-medium text-sm">{past.name ?? past.period}</p>
                <p className="text-muted-foreground text-xs">
                  {past.name ? `${past.period} - ` : ""}
                  {periodRange(past)}
                </p>
              </div>
            ))}
          </SidebarCard>
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
