import { Badge, Card, CardContent, CardHeader, Heading, Skeleton } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { FolderOpen } from "lucide-react"
import Link from "next/link"
import { EmptyState } from "@/components/EmptyState"
import { withRedirect } from "@/features/auth/redirect"
import { formatDate } from "@/features/courses/courses.format"
import { ResourceCardActionsServer } from "@/features/resources/components/ResourceCardActionsServer"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"
import { isOwnProfile } from "../../members.ownership"
import { type MembersRouteParams, parseMemberId } from "../../members.params"
import { getMemberResourcesCached } from "../../members.queries"
import { mobileSection } from "./mobileSection"

// Aliased as the React compiler rule reads a capitalized call inside a component as
// a component rendered the wrong way.
const memberHref = Routes.MEMBERS.MEMBER
const resourceHref = Routes.RESOURCES.RESOURCE

type MemberResource = Awaited<ReturnType<typeof getMemberResourcesCached>>[number]

export const MemberResources = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  // Profiles are public but resources are for members only, so a guest is asked to sign in
  // rather than shown what the member shared.
  const { user } = await getCurrentUser()

  return (
    <section className={cn("flex flex-col gap-4 max-md:order-5", mobileSection)}>
      <Heading level="h2">Resources</Heading>
      {user ? (
        <ResourceList
          canEdit={await isOwnProfile(memberId)}
          memberId={memberId}
          resources={await getMemberResourcesCached(memberId)}
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          <Link
            className="underline underline-offset-2"
            href={withRedirect(Routes.LOGIN, memberHref(memberId))}
          >
            Sign in
          </Link>{" "}
          to see the resources this member has shared.
        </p>
      )}
    </section>
  )
}

const ResourceList = ({
  canEdit,
  memberId,
  resources,
}: {
  /** On the member's own profile: an Edit/Delete menu per resource. */
  canEdit: boolean
  memberId: number
  resources: MemberResource[]
}) => {
  if (resources.length === 0) {
    return <EmptyState icon={<FolderOpen />} title="No resources shared yet" variant="section" />
  }

  return (
    <div className="flex flex-col gap-3">
      {resources.map((resource) => {
        const shared = formatDate(resource.createdAt)
        const course = typeof resource.course === "object" ? resource.course : undefined
        const attachments = resource.attachments?.length ?? 0

        return (
          // The menu sits beside the card's link, not inside it - its buttons can't nest in a link.
          <div className="relative" key={resource.id}>
            <Link className="group" href={resourceHref(String(resource.id))}>
              <Card className="transition-colors group-hover:ring-foreground/25">
                <CardHeader className="flex items-center justify-between gap-3">
                  <Badge variant="blue">{course?.code ?? "Resource"}</Badge>
                  {shared && <span className="text-muted-foreground text-xs">Shared {shared}</span>}
                </CardHeader>
                <CardContent className={cn("flex flex-col gap-1", canEdit && "pr-10")}>
                  <span className="font-medium group-hover:underline">{resource.title}</span>
                  {attachments > 0 && (
                    <span className="text-muted-foreground text-xs">
                      {attachments === 1 ? "1 attachment" : `${attachments} attachments`}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
            {canEdit && (
              <div className="absolute right-4 bottom-4">
                <ResourceCardActionsServer
                  ownerId={memberId}
                  resourceId={resource.id}
                  title={resource.title}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export const MemberResourcesSkeleton = () => (
  <div className={cn("flex flex-col gap-4 max-md:order-5", mobileSection)}>
    <Skeleton className="h-7 w-40" />
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-16 w-full" />
  </div>
)
