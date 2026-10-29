import { MemberLabel } from "@repo/ui/components/composite"
import Link from "next/link"
import { getAuthorCandidates } from "@/features/publications/authorCandidates.queries"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { Routes } from "@/lib/routes"
import { isCourseEditor, isCourseOwner, ownerIdOf } from "../courses.format"
import { getPublishedCourseCached } from "../courses.queries"
import { CourseOfferingSidebarCard } from "./CourseOffering/CourseOfferingPrimitives"
import { ManageEditorsButton } from "./ManageEditorsButton"

// Aliased as the React compiler rule reads a capitalized call inside a component as
// a component rendered the wrong way.
const memberHref = Routes.MEMBERS.MEMBER

/**
 * Who can edit the course and all its offerings: its owner, then its editors. Shown
 * only to them - everyone else sees the teaching team. Per-viewer, so the course page
 * renders this in its own Suspense boundary.
 */
export async function CourseEditors({ courseId }: { courseId: number }) {
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) return null

  const course = await getPublishedCourseCached(courseId)
  if (!course || !isCourseEditor(course, user.id)) return null

  const editorIds = (course.editors ?? []).map((editor) =>
    typeof editor === "number" ? editor : editor.id,
  )
  // Read fresh, not from the cached member list: the dialog saves the whole list, so a
  // new member missing from the cache would be dropped from the course's editors.
  const members = new Map(
    (await getAuthorCandidates([ownerIdOf(course) ?? 0, ...editorIds])).map((member) => [
      member.id,
      member,
    ]),
  )
  const owner = members.get(ownerIdOf(course) ?? 0)
  if (!owner) return null
  const editors = editorIds.flatMap((id) => {
    const member = members.get(id)
    return member && !isCourseOwner(course, id) ? [member] : []
  })

  return (
    <CourseOfferingSidebarCard title={`Course editors - ${editors.length + 1}`}>
      {[owner, ...editors].map((member) => (
        <Link
          className="flex min-w-0 items-center justify-between gap-2 self-stretch hover:underline"
          href={memberHref(member.id)}
          key={member.id}
        >
          <MemberLabel member={member} />
          {member.id === owner.id && (
            <span className="shrink-0 text-muted-foreground text-xs">Owner</span>
          )}
        </Link>
      ))}
      {isCourseOwner(course, user.id) && (
        <ManageEditorsButton courseId={courseId} editors={editors} owner={owner} />
      )}
    </CourseOfferingSidebarCard>
  )
}
