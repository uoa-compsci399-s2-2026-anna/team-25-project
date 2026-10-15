import { MemberTitleLabels } from "@repo/shared/enums/members"
import { POSITION_MAX_LENGTH } from "@repo/shared/schemas/register"
import { initials } from "@repo/shared/utils/initials"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  type BadgeProps,
  Heading,
  Skeleton,
} from "@repo/ui/components/ui"
import { notFound } from "next/navigation"
import { EditButton } from "@/components/Editor/EditButton"
import { EditSwitch, ViewOnly } from "@/components/Editor/EditField"
import { EditInput } from "@/components/Editor/EditInput"
import { EditSelect } from "@/components/Editor/EditSelect"
import { getInstitutionCached } from "@/features/institutions/institutions.queries"
import { isOwnProfile } from "../../members.ownership"
import { type MembersRouteParams, parseMemberId } from "../../members.params"
import { getMemberDetailsCached } from "../../members.queries"
import { EditUploadAvatar } from "../MemberEditor/EditUploadAvatar"

// Built from the enum, so the dropdown can only offer approved titles.
const titleOptions = toSelectOptions(MemberTitleLabels)

// The phone header's interest tags cycle through these, as the design shows.
const tagVariants: BadgeProps["variant"][] = ["salmon", "blue", "pink"]

export const MemberHeader = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const [member, canEdit] = await Promise.all([
    getMemberDetailsCached(memberId),
    isOwnProfile(memberId),
  ])
  if (!member) notFound()

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
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-6 max-md:flex-col max-md:text-center">
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
        <div className="flex min-w-0 flex-1 flex-col gap-2 max-md:items-center">
          <EditSwitch view={<Heading level="h1">{fullName}</Heading>}>
            <div className="flex flex-wrap items-start gap-2 max-md:justify-center">
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
          <div className="flex flex-row flex-wrap items-center gap-1 text-muted-foreground max-md:justify-center max-md:text-sm">
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
          {/* A visual echo of the Research interests section further down, which is where
              they're read out and edited, so screen readers skip these. */}
          {member.researchInterests?.length ? (
            <ViewOnly>
              <ul aria-hidden className="flex flex-wrap justify-center gap-1 md:hidden">
                {member.researchInterests.map((interest, index) => (
                  <li key={interest}>
                    <Badge variant={tagVariants[index % tagVariants.length]}>{interest}</Badge>
                  </li>
                ))}
              </ul>
            </ViewOnly>
          ) : null}
        </div>
      </div>
      {/* On phones the edit button sits at the foot of the page instead, see MemberEditBar. */}
      {canEdit && (
        <div className="max-md:hidden">
          <EditButton />
        </div>
      )}
    </div>
  )
}

export const MemberHeaderSkeleton = () => (
  <div className="flex flex-wrap items-center gap-6 max-md:flex-col">
    <Skeleton className="size-32 rounded-full" />
    <div className="flex flex-1 flex-col gap-3 max-md:w-full max-md:items-center">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  </div>
)
