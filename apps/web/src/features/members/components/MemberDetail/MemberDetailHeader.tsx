import { MemberTitleLabels } from "@repo/shared/enums/members"
import { initials } from "@repo/shared/utils/initials"
import { Avatar, AvatarFallback, AvatarImage, Heading, Skeleton } from "@repo/ui/components/ui"
import { notFound } from "next/navigation"
import { getInstitutionCached } from "@/features/institutions/institutions.queries"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { type MembersRouteParams, parseMemberId } from "../../members.params"
import { getMemberDetailsCached } from "../../members.queries"
import { MemberAvatarEditor } from "../MemberEditor/AvatarEditor"
import { MemberNameEditor } from "../MemberEditor/NameEditor"
import { MemberPositionEditor } from "../MemberEditor/PositionEditor"

export const MemberHeader = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const [member, { collection, user }] = await Promise.all([
    getMemberDetailsCached(memberId),
    getCurrentUser(),
  ])
  if (!member) notFound()

  const isOwnProfile = collection === Slugs.Collections.MEMBERS && user.id === member.id

  const institution =
    typeof member.institution === "number"
      ? await getInstitutionCached(member.institution)
      : member.institution

  const avatarUrl = typeof member.avatar === "object" ? member.avatar?.url : null
  const rest = [institution?.name, institution?.country].filter(Boolean).join(" - ")
  const affiliation = [member.position, rest].filter(Boolean).join(" - ")

  return (
    <div className="flex flex-wrap items-center gap-6">
      {isOwnProfile ? (
        <MemberAvatarEditor
          fallback={initials(member.firstName, member.lastName)}
          image={avatarUrl ? { alt: "", src: avatarUrl } : undefined}
        />
      ) : (
        <Avatar size="xxl">
          {avatarUrl && <AvatarImage alt="" src={avatarUrl} />}
          <AvatarFallback className="text-3xl">
            {initials(member.firstName, member.lastName)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {isOwnProfile ? (
          <MemberNameEditor
            firstName={member.firstName}
            lastName={member.lastName}
            title={member.title ?? null}
          />
        ) : (
          <Heading level="h1">
            {[member.title && MemberTitleLabels[member.title], member.firstName, member.lastName]
              .filter(Boolean)
              .join(" ")}
          </Heading>
        )}
        {isOwnProfile ? (
          <MemberPositionEditor position={member.position} rest={rest} />
        ) : (
          affiliation && <p className="text-muted-foreground">{affiliation}</p>
        )}
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
