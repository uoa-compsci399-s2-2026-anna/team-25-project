import { initials } from "@repo/shared/utils/initials"
import { normaliseResearchInterests } from "@repo/shared/utils/research-interests"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import Link from "next/link"
import type { AppRoute } from "@/lib/routes"

export type MemberCardProps = {
  firstName: string
  lastName: string
  position?: string | null
  institution?: string
  /** The institution's country code, shown beside its name as in "University of Example - NZ". */
  country?: string
  /** Omit to fall back to the member's initials. */
  avatarSrc?: string
  /** The member's profile page. */
  href: AppRoute
  researchInterests?: string[] | null
}

/** A member may list ten; past this the card stops being a card. */
const INTERESTS_SHOWN = 3

// Below sm the card becomes a divided list row, as in the mobile design.
const cardClassName = "h-full max-sm:rounded-none max-sm:bg-transparent max-sm:py-5 max-sm:ring-0"
const headerClassName =
  "gap-4 max-sm:grid-cols-[auto_1fr] max-sm:gap-x-4 max-sm:gap-y-1.5 max-sm:px-0"
// Bleeds into the list's padding so the divider runs nearer the screen edge.
const rowBleedClassName = "max-sm:-mx-6 max-sm:px-6"
// Only with interests, or the empty second row adds a gap.
const avatarSpanClassName = "max-sm:row-span-2"

export const MemberCard = ({
  avatarSrc,
  country,
  firstName,
  href,
  institution,
  lastName,
  position,
  researchInterests,
}: MemberCardProps) => {
  const affiliation = [institution, country].filter(Boolean).join(" - ")
  // Free text, so blanks and repeats are possible; both would render as noise.
  const interests = normaliseResearchInterests(researchInterests ?? [])
  const shown = interests.slice(0, INTERESTS_SHOWN)
  const hidden = interests.length - shown.length

  return (
    <Link
      className={cn(
        "group rounded-lg focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 max-sm:rounded-none",
        "transition-colors max-sm:hover:bg-foreground/5",
        rowBleedClassName,
      )}
      href={href}
    >
      <Card className={cn(cardClassName, "transition-colors group-hover:ring-foreground/25")}>
        <CardHeader className={headerClassName}>
          <Avatar className={cn(shown.length > 0 && avatarSpanClassName)} size="lg">
            {avatarSrc && <AvatarImage alt="" src={avatarSrc} />}
            <AvatarFallback>{initials(firstName, lastName)}</AvatarFallback>
          </Avatar>

          {/* Grouped so these sit closer to each other than to the avatar above. */}
          <div className="flex flex-col gap-0.5">
            <CardTitle>{`${firstName} ${lastName}`}</CardTitle>
            {/* Inline on phones, so a long affiliation wraps without leaving "|" hanging. */}
            <div className="flex flex-col max-sm:block max-sm:text-xs">
              {position && (
                <CardDescription className="text-muted-foreground text-xs max-sm:inline">
                  {position}
                </CardDescription>
              )}
              {position && affiliation && (
                <>
                  <span
                    aria-hidden
                    className="mx-2 hidden text-muted-foreground text-xs max-sm:inline"
                    data-slot="member-card-separator"
                  >
                    |
                  </span>
                  {/* Stops screen readers running the two texts together. */}
                  <span className="sr-only">, </span>
                </>
              )}
              {affiliation && (
                <CardDescription className="text-muted-foreground text-xs max-sm:inline">
                  {affiliation}
                </CardDescription>
              )}
            </div>
          </div>

          {shown.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {shown.map((interest) => (
                <li className="min-w-0 max-w-full" key={interest}>
                  {/* Interests run to 50 characters, wider than a card in a four-column grid. */}
                  <Badge className="max-w-full truncate" variant="blue">
                    {interest}
                  </Badge>
                </li>
              ))}
              {hidden > 0 && (
                <li>
                  <Badge variant="outline">{`+${hidden}`}</Badge>
                </li>
              )}
            </ul>
          )}
        </CardHeader>
      </Card>
    </Link>
  )
}

export const MemberCardSkeleton = () => (
  <Card className={cn(cardClassName, rowBleedClassName)}>
    <CardHeader className={headerClassName}>
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-36" />
      </div>
    </CardHeader>
  </Card>
)
