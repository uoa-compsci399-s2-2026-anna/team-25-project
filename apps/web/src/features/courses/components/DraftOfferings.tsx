import { Badge } from "@repo/ui/components/ui"
import { EyeOff } from "lucide-react"
import { periodRange, toOfferingValues } from "../courses.format"
import { getMyDraftOfferings } from "../courses.queries"
import { CourseOfferingSidebarCard } from "./CourseOffering/CourseOfferingPrimitives"
import { EditDraftOfferingDialog } from "./OfferingDialogs"

/**
 * The course's draft offerings, for its owner and editors - nobody else gets any.
 * Each one reopens in the offering dialog. Per-viewer, so the course page renders
 * this in its own Suspense boundary, apart from the cached published offerings.
 */
export async function DraftOfferings({ courseId }: { courseId: number }) {
  const drafts = await getMyDraftOfferings(courseId)
  if (drafts.length === 0) return null

  return (
    <CourseOfferingSidebarCard title={`Drafts - ${drafts.length}`}>
      <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <EyeOff aria-hidden="true" className="size-3.5 shrink-0" />
        Only the course's owner and editors can see these.
      </p>
      {drafts.map((draft) => (
        <EditDraftOfferingDialog
          courseId={courseId}
          initialValues={toOfferingValues(draft)}
          key={draft.id}
          offeringId={draft.id}
          trigger={
            <button
              className="-mx-2 flex items-center justify-between gap-2 self-stretch rounded-md px-2 py-1 text-left hover:bg-muted"
              type="button"
            >
              <div className="flex flex-col">
                <p className="font-medium text-sm">{draft.period || "No period yet"}</p>
                <p className="text-muted-foreground text-xs">{periodRange(draft)}</p>
              </div>
              <Badge variant="secondary">Draft</Badge>
            </button>
          }
        />
      ))}
    </CourseOfferingSidebarCard>
  )
}
