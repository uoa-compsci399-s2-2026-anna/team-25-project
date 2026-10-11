import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"

/** Whether the signed-in user is the member whose profile this is. Admins never are. */
export const isOwnProfile = async (memberId: number) => {
  const { collection, user } = await getCurrentUser()
  return collection === Slugs.Collections.MEMBERS && user.id === memberId
}
