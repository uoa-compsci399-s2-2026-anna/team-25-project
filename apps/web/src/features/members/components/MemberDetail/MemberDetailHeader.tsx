import { MemberTitleLabels } from "@repo/shared/enums/members"
import { POSITION_MAX_LENGTH } from "@repo/shared/schemas/register"
import { initials } from "@repo/shared/utils/initials"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import { Avatar, AvatarFallback, AvatarImage, Heading, Skeleton } from "@repo/ui/components/ui"
import { notFound } from "next/navigation"
import { getInstitutionCached } from "@/features/institutions/institutions.queries"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { type MembersRouteParams, parseMemberId } from "../../members.params"
import { getMemberDetailsCached } from "../../members.queries"
import { EditButton } from "../MemberEditor/EditButton"
import { EditSwitch } from "../MemberEditor/EditField"
import { EditInput } from "../MemberEditor/EditInput"
import { EditSelect } from "../MemberEditor/EditSelect"
import { EditUploadAvatar } from "../MemberEditor/EditUploadAvatar"

// Built from the enum, so the dropdown can only offer approved titles.
const titleOptions = toSelectOptions(MemberTitleLabels)

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

  const rest = [institution?.name, institution?.country].filter(Boolean).join(" - ")
  const avatarUrl = typeof member.avatar === "object" ? member.avatar?.url : null
  const memberInitials = initials(member.firstName, member.lastName)
  const fullName = [
    member.title && MemberTitleLabels[member.title],
    member.firstName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-6">
        <EditUploadAvatar
          fallback={<span className="text-3xl">{memberInitials}</span>}
          image={avatarUrl ? { alt: "", src: avatarUrl } : undefined}
          name="avatar"
          view={
            <Avatar size="xxl">
              {avatarUrl && <AvatarImage alt="" src={avatarUrl} />}
              <AvatarFallback className="text-3xl">{memberInitials}</AvatarFallback>
            </Avatar>
          }
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <EditSwitch view={<Heading level="h1">{fullName}</Heading>}>
            <div className="flex flex-wrap items-start gap-2">
              <EditSelect
                className="w-32"
                label="Title"
                name="title"
                nullLabel="None"
                options={titleOptions}
                value={member.title}
              />
              <EditInput
                className="w-40"
                label="First name"
                name="firstName"
                value={member.firstName}
              />
              <EditInput
                className="w-40"
                label="Last name"
                name="lastName"
                value={member.lastName}
              />
            </div>
          </EditSwitch>
          <div className="flex flex-row flex-wrap items-center gap-1 text-muted-foreground">
            <EditInput
              className="max-w-xs"
              label="Position"
              maxLength={POSITION_MAX_LENGTH}
              name="position"
              value={member.position}
              view={member.position && <span>{member.position}</span>}
            />{" "}
            {rest && <span>{member.position ? `- ${rest}` : rest}</span>}
          </div>
        </div>
      </div>
      {isOwnProfile && <EditButton />}
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
