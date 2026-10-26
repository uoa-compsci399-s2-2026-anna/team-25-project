import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

/**
 * Whether a reset link still works, so the page can say it's dead before the
 * member types a new password. `resetPassword` checks again on submit, in case
 * the link runs out while the page is open.
 */
export const isResetTokenLive = async (token: string) => {
  const payload = await getPayloadClient()
  const { totalDocs } = await payload.count({
    collection: Slugs.Collections.MEMBERS,
    overrideAccess: true,
    where: {
      and: [
        { resetPasswordToken: { equals: token } },
        { resetPasswordExpiration: { greater_than: new Date().toISOString() } },
      ],
    },
  })
  return totalDocs > 0
}
