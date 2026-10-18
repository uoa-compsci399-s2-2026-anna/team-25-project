import { Badge } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { InfoIcon } from "lucide-react"
import type * as React from "react"

/** Where an offering sits relative to today. */
export type CourseOfferingTiming = "upcoming" | "inProgress" | "ended"

export const courseOfferingTimingLabels: Record<CourseOfferingTiming, string | null> = {
  upcoming: "Upcoming",
  inProgress: "In progress",
  // The default state of most of a course's offerings, so it goes unlabelled.
  ended: null,
}

const timingVariants = {
  upcoming: "blue",
  inProgress: "active",
  ended: "closed",
} as const

type CourseOfferingLinkProps = {
  href: string
  className?: string
  children?: React.ReactNode
  "aria-current"?: "page"
}

type LinkComponent = React.ElementType<CourseOfferingLinkProps>

/** The offering's period, coloured by its timing: salmon in progress, blue upcoming, grey ended. */
function CourseOfferingPeriodBadge({
  period,
  timing,
  className,
}: {
  period: string
  timing: CourseOfferingTiming
  className?: string
}) {
  return (
    <Badge className={cn("uppercase tracking-wide", className)} variant={timingVariants[timing]}>
      {period}
    </Badge>
  )
}

/** Flags an offering that hasn't started or is under way; an ended one shows nothing. */
function CourseOfferingTimingBadge({ timing }: { timing: CourseOfferingTiming }) {
  const label = courseOfferingTimingLabels[timing]
  return label ? <Badge variant={timingVariants[timing]}>{label}</Badge> : null
}

export type CourseOfferingListItem = {
  id: number
  period: string
  timing: CourseOfferingTiming
  href: string
  /** A second line, e.g. the dates, or a name that differs from the selected offering's. */
  detail?: string
}

/**
 * Every offering of a course as links, the selected one highlighted. Rendered
 * inside a card, which it bleeds into so the highlight lines up with the card's padding.
 */
function CourseOfferingList({
  items,
  selectedId,
  linkComponent: LinkComponent = "a",
  className,
}: {
  items: CourseOfferingListItem[]
  selectedId: number
  linkComponent?: LinkComponent
  className?: string
}) {
  return (
    <ul className={cn("-mx-2 flex flex-col gap-1 self-stretch", className)}>
      {items.map((item) => {
        const isSelected = item.id === selectedId
        return (
          <li key={item.id}>
            <LinkComponent
              aria-current={isSelected ? "page" : undefined}
              className={cn(
                "flex flex-col gap-0.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted",
                isSelected && "bg-muted",
              )}
              href={item.href}
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm">{item.period}</span>
                <CourseOfferingTimingBadge timing={item.timing} />
              </span>
              {item.detail && <span className="text-muted-foreground text-xs">{item.detail}</span>}
            </LinkComponent>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Says the page isn't showing the course's current offering, so nobody reads
 * last year's assessments (or next year's) without realising, and links back to it.
 */
function CourseOfferingNotice({
  period,
  timing,
  currentPeriod,
  currentHref,
  linkComponent: LinkComponent = "a",
  className,
}: {
  period: string
  timing: CourseOfferingTiming
  currentPeriod: string
  currentHref: string
  linkComponent?: LinkComponent
  className?: string
}) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-brand-slate/10 px-3 py-2 text-brand-slate text-sm",
        className,
      )}
      role="status"
    >
      <InfoIcon aria-hidden="true" className="size-4 shrink-0" />
      <span>
        You're viewing the {period} offering
        {timing === "upcoming" ? ", which hasn't started yet" : ""}.
      </span>
      <LinkComponent className="font-medium underline underline-offset-4" href={currentHref}>
        View {currentPeriod}
      </LinkComponent>
    </p>
  )
}

export {
  CourseOfferingList,
  CourseOfferingNotice,
  CourseOfferingPeriodBadge,
  CourseOfferingTimingBadge,
}
