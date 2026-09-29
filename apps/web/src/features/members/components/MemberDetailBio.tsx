import { Skeleton } from "@repo/ui/components/ui"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { type MembersRouteParams, parseMemberId } from "../members.params"
import { getMemberDetailsCached } from "../members.queries"
import { MemberBioEditor } from "./MemberDetailBioEditor"

export const MemberBio = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const [member, { collection, user }] = await Promise.all([
    getMemberDetailsCached(memberId),
    getCurrentUser(),
  ])
  if (!member) return null

  const isOwnProfile = collection === Slugs.Collections.MEMBERS && user.id === member.id

  return isOwnProfile ? (
    <MemberBioEditor bio={member.bio} />
  ) : (
    <div className="flex flex-col">
      <h1 className="font-bold text-muted-foreground text-sm">ABOUT</h1>
      <span className="text-black">{member.bio}</span>
    </div>
  )
}

export const MemberBioSkeleton = () => <Skeleton className="h-20 w-full" />
