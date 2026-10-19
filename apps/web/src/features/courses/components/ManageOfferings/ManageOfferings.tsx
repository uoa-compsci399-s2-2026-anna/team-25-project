import { getManageableOfferings } from "../../courses.queries"
import { ManageOfferingsDialog } from "./ManageOfferingsDialog"

/**
 * The "Manage offerings" button, for the course's owner and editors only. It
 * reads the viewer, so it renders in its own Suspense boundary beside the cached
 * header rather than inside it.
 */
export const ManageOfferings = async ({ courseId }: { courseId: number }) => {
  const data = await getManageableOfferings(courseId)
  return data ? <ManageOfferingsDialog data={data} /> : null
}
