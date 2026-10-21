import { EditButton } from "@/components/Editor/EditButton"
import { isOwnProfile } from "../../members.ownership"
import { type MembersRouteParams, parseMemberId } from "../../members.params"

/**
 * The phone layout's edit button, kept in reach at the foot of the screen. Wide screens use
 * the one in the header instead.
 */
export const MemberEditBar = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  if (!(await isOwnProfile(memberId))) return null

  return (
    // -mt-px lays the top rule over the last section's, so they don't double up at the end.
    <div className="sticky bottom-0 z-10 -mt-px flex justify-center border-t bg-background py-4 max-md:order-last md:hidden">
      <EditButton className="items-center" label="Edit profile" />
    </div>
  )
}
