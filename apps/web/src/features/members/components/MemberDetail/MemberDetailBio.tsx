import { Skeleton } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { type MembersRouteParams, parseMemberId } from "../../members.params"
import { getMemberDetailsCached } from "../../members.queries"
import { EditDiv } from "../MemberEditor/EditDiv"
import { EditInput } from "../MemberEditor/EditInput"
import { mobileSection } from "./mobileSection"

export const MemberBio = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const member = await getMemberDetailsCached(memberId)

  const heading = <h2 className="font-bold text-muted-foreground text-sm">ABOUT</h2>

  return (
    // The heading only shows with a bio or while editing, so without it there's nothing to divide.
    <div
      className={cn("flex flex-col gap-1 max-md:order-3 max-md:not-has-[h2]:hidden", mobileSection)}
    >
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

export const MemberBioSkeleton = () => (
  <div className={cn("max-md:order-3", mobileSection)}>
    <Skeleton className="h-20 w-full" />
  </div>
)
