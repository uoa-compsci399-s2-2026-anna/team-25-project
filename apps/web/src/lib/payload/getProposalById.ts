import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

export const getProposalById = async (id: number) => {
  const payload = await getPayloadClient()
  return payload.findByID({
    id,
    collection: Slugs.Collections.PROPOSALS,
    // return null instead of throwing when the id doesn't exist
    disableErrors: true,
  })
}
