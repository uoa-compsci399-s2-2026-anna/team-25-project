import { initials } from "@repo/shared/utils/initials"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Heading,
  Skeleton,
} from "@repo/ui/components/ui"
import { notFound } from "next/navigation"
import { getInstitutionCached } from "@/features/institutions/institutions.queries"
import { getMemberDetailsCached } from "../member.queries"
import { type MembersRouteParams, parseMemberId } from "../members.params"

export const MemberHeader = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const member = await getMemberDetailsCached(memberId)
  if (!member) notFound()

  const institution =
    typeof member.institution === "number"
      ? await getInstitutionCached(member.institution)
      : member.institution

  const avatarUrl = typeof member.avatar === "object" ? member.avatar?.url : null
  const affiliation = [member.position, institution?.name, institution?.country]
    .filter(Boolean)
    .join(" - ")

  return (
    <div className="flex flex-wrap items-center gap-6">
      <Avatar size="xxl">
        {avatarUrl && <AvatarImage alt="" src={avatarUrl} />}
        <AvatarFallback className="text-3xl">
          {initials(member.firstName, member.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Heading level="h1">
          {member.firstName} {member.lastName}
        </Heading>
        {affiliation && <p className="text-muted-foreground">{affiliation}</p>}
        <div className="flex flex-row gap-1">
          <Badge>TODO</Badge>
        </div>
      </div>
    </div>
  )
}

export const MemberHeaderSkeleton = () => (
  <div className="flex flex-wrap items-center gap-6">
    <Skeleton className="size-32 rounded-full" />
    <div className="flex flex-1 flex-col gap-3">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  </div>
)
