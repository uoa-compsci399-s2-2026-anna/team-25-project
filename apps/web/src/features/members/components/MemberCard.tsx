import { initials } from "@repo/shared/utils/initials"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui"
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
}

export const MemberCard = ({
  avatarSrc,
  country,
  firstName,
  href,
  institution,
  lastName,
  position,
}: MemberCardProps) => {
  const affiliation = [institution, country].filter(Boolean).join(" - ")

  return (
    <Link
      className="group rounded-lg focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      href={href}
    >
      <Card className="h-full transition-colors group-hover:ring-foreground/25">
        <CardHeader className="gap-4">
          <Avatar size="lg">
            {avatarSrc && <AvatarImage alt="" src={avatarSrc} />}
            <AvatarFallback>{initials(firstName, lastName)}</AvatarFallback>
          </Avatar>

          {/* Grouped so these sit closer to each other than to the avatar above. */}
          <div className="flex flex-col gap-0.5">
            <CardTitle>{`${firstName} ${lastName}`}</CardTitle>
            {position && (
              <CardDescription className="text-muted-foreground text-xs">
                {position}
              </CardDescription>
            )}
            {affiliation && (
              <CardDescription className="text-muted-foreground text-xs">
                {affiliation}
              </CardDescription>
            )}
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
