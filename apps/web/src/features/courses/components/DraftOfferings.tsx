import { Badge, Button } from "@repo/ui/components/ui"
import { EyeOff } from "lucide-react"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { isCourseEditor, periodRange, toOfferingValues } from "../courses.format"
import { getMyDraftOfferings, getPublishedCourseCached } from "../courses.queries"
import { CourseOfferingSidebarCard } from "./CourseOffering/CourseOfferingPrimitives"
import { EditDraftOfferingDialog } from "./OfferingDialogs"

/**
 * The course's draft offerings, for its owner, editors and each draft's teaching
 * team - nobody else gets any. Each one reopens in the offering dialog. Per-viewer,
 * so the course page renders this in its own Suspense boundary, apart from the
 * cached published offerings.
 */
export async function DraftOfferings({ courseId }: { courseId: number }) {
  const drafts = await getMyDraftOfferings(courseId)
  if (drafts.length === 0) return null

  const { collection, user } = await getCurrentUser()
  const course = await getPublishedCourseCached(courseId)
  const editor =
    collection === Slugs.Collections.MEMBERS && course !== null && isCourseEditor(course, user.id)

  return (
    <CourseOfferingSidebarCard title={`Drafts - ${drafts.length}`}>
      <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <EyeOff aria-hidden="true" className="size-3.5 shrink-0" />
        Only the course's owner, editors and teaching team can see these.
      </p>
      {drafts.map((draft) => (
        <EditDraftOfferingDialog
          canDelete={editor}
          courseId={courseId}
          initialValues={toOfferingValues(draft)}
          key={draft.id}
          offeringId={draft.id}
          trigger={
            <Button
              className="-mx-2 h-auto justify-between gap-2 self-stretch rounded-md px-2 py-1 text-left hover:bg-muted"
              variant="button-transparent"
            >
              <div className="flex flex-col">
                <p className="font-medium text-sm">{draft.period || "No period yet"}</p>
                <p className="text-muted-foreground text-xs">{periodRange(draft)}</p>
              </div>
              {/* Outline, as a filled badge in the blush of the row's hover would vanish into it. */}
              <Badge variant="outline">Draft</Badge>
            </Button>
          }
        />
      ))}
    </CourseOfferingSidebarCard>
  )
}
