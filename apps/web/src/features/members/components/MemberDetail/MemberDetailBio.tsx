import { Skeleton } from "@repo/ui/components/ui"
import { type MembersRouteParams, parseMemberId } from "../../members.params"
import { getMemberDetailsCached } from "../../members.queries"
import { EditInput } from "../MemberEditor/EditInput"

export const MemberBio = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const member = await getMemberDetailsCached(memberId)
  if (!member?.bio?.trim()) return null

  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-bold text-muted-foreground text-sm">ABOUT</h2>
      <EditInput
        label="Bio"
        multiline
        name="bio"
        value={member.bio}
        view={<p className="text-foreground">{member.bio}</p>}
      />
    </div>
  )
}

export const MemberBioSkeleton = () => <Skeleton className="h-20 w-full" />
