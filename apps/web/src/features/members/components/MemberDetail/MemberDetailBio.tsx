import { Skeleton } from "@repo/ui/components/ui"
import { type MembersRouteParams, parseMemberId } from "../../members.params"
import { getMemberDetailsCached } from "../../members.queries"
import { EditDiv } from "../MemberEditor/EditDiv"
import { EditInput } from "../MemberEditor/EditInput"

export const MemberBio = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const member = await getMemberDetailsCached(memberId)

  const heading = <h2 className="font-bold text-muted-foreground text-sm">ABOUT</h2>

  return (
    <div className="flex flex-col gap-1">
      <EditDiv view={member?.bio?.trim() && heading}>{heading}</EditDiv>

      <EditInput
        label="About"
        multiline
        name="bio"
        placeholder="Add your bio..."
        value={member?.bio}
        view={<p className="text-foreground">{member?.bio}</p>}
      />
    </div>
  )
}

export const MemberBioSkeleton = () => <Skeleton className="h-20 w-full" />
