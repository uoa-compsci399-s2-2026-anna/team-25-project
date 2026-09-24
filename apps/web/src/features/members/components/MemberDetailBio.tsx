import { Skeleton } from "@repo/ui/components/ui"
import { type MembersRouteParams, parseMemberId } from "../members.params"
import { getMemberDetailsCached } from "../members.queries"

export const MemberBio = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const member = await getMemberDetailsCached(memberId)
  if (!member) return null

  return (
    <div className="flex flex-col">
      <h1 className="font-bold text-muted-foreground text-sm">ABOUT</h1>
      <span className="text-black">{member.bio}</span>
    </div>
  )
}

export const MemberBioSkeleton = () => <Skeleton className="h-20 w-full" />
