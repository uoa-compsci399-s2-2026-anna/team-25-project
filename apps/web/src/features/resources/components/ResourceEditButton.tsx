import { EditButton } from "@/components/Editor/EditButton"
import { StartEditingOnLoad } from "@/components/Editor/StartEditingOnLoad"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { getResourceByIdCached } from "../resources.queries"

// getCurrentUser() reads headers(), which is dynamic - kept in its own component behind a
// Suspense boundary so it doesn't drag the rest of the resource page along with it.
export const ResourceEditButton = async ({ id }: { id: number }) => {
  const [resource, { collection, user }] = await Promise.all([
    getResourceByIdCached(id),
    getCurrentUser(),
  ])

  if (!resource) {
    return null
  }

  // Same rule as the collection's isAdminOrOwner: admins, and the resource's owner.
  const ownerId = typeof resource.owner === "object" ? resource.owner.id : resource.owner
  const canEditResource =
    collection === Slugs.Collections.ADMIN || (user !== null && user.id === ownerId)

  if (!canEditResource) {
    return null
  }

  return (
    <>
      <EditButton
        borderColor="charcoal"
        className="max-w-none items-stretch"
        label="Edit resource"
        variant="button-transparent"
      />
      {/* This only renders for people who can edit, so #edit does nothing for anyone else. */}
      <StartEditingOnLoad />
    </>
  )
}
