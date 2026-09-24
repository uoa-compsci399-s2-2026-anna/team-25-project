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

export type MemberCardProps = {
  firstName: string
  lastName: string
  position?: string | null
  institution?: string
  /** The institution's country code, shown beside its name as in "University of Example - NZ". */
  country?: string
  /** Omit to fall back to the member's initials. */
  avatarSrc?: string
}

export const MemberCard = ({
  avatarSrc,
  country,
  firstName,
  institution,
  lastName,
  position,
}: MemberCardProps) => {
  const affiliation = [institution, country].filter(Boolean).join(" - ")

  return (
    <Card>
      <CardHeader className="gap-4">
        <Avatar size="lg">
          {avatarSrc && <AvatarImage alt="" src={avatarSrc} />}
          <AvatarFallback>{initials(firstName, lastName)}</AvatarFallback>
        </Avatar>

        {/* Grouped so these sit closer to each other than to the avatar above. */}
        <div className="flex flex-col gap-0.5">
          <CardTitle>{`${firstName} ${lastName}`}</CardTitle>
          {position && (
            <CardDescription className="text-muted-foreground text-xs">{position}</CardDescription>
          )}
          {affiliation && (
            <CardDescription className="text-muted-foreground text-xs">
              {affiliation}
            </CardDescription>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}
