import { StartEditingOnLoad } from "@/components/Editor/StartEditingOnLoad"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { getResourceByIdCached } from "../resources.queries"
import { ResourceTitleActions } from "./ResourceTitleActions"

// getCurrentUser() reads headers(), which is dynamic - kept in its own
// component behind a Suspense boundary so it doesn't drag the rest of the
// resource page along with it under cacheComponents.
export const ResourceTitleActionsServer = async ({ id }: { id: number }) => {
  const [resource, { collection, user }] = await Promise.all([
    getResourceByIdCached(id),
    getCurrentUser(),
  ])

  if (!resource) {
    return null
  }

  // Same rule as Payload's isAdminOrOwner: admins, and the resource's owner -
  // who can edit and delete alike.
  const ownerId = typeof resource.owner === "object" ? resource.owner.id : resource.owner
  const canManage = collection === Slugs.Collections.ADMIN || (user !== null && user.id === ownerId)

  if (!canManage) {
    return null
  }

  return (
    <>
      <ResourceTitleActions resourceId={id} title={resource.title} />
      {/* This only renders for people who can edit, so #edit does nothing for anyone else. */}
      <StartEditingOnLoad />
    </>
  )
}
