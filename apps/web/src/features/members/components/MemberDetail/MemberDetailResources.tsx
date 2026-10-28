import { Badge, Card, CardContent, CardHeader, Skeleton } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { FolderOpen } from "lucide-react"
import Link from "next/link"
import { withEditHash } from "@/components/Editor/editOnLoad"
import { EmptyState } from "@/components/EmptyState"
import { withRedirect } from "@/features/auth/redirect"
import { formatDate } from "@/features/courses/courses.format"
import { ResourceCardActions } from "@/features/resources/components/ResourceCardActions"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"
import { isOwnProfile } from "../../members.ownership"
import { type MembersRouteParams, parseMemberId } from "../../members.params"
import { getMemberResourcesCached } from "../../members.queries"
import { MemberDetailSection } from "./MemberDetailSection"
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
    <MemberDetailSection className={cn("max-md:order-5", mobileSection)} title="Resources">
      {user ? (
        <ResourceList
          canEdit={await isOwnProfile(memberId)}
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
    </MemberDetailSection>
  )
}

const ResourceList = ({
  canEdit,
  resources,
}: {
  /** On the member's own profile: an Edit/Delete menu per resource. */
  canEdit: boolean
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
        const href = resourceHref(String(resource.id))

        return (
          // The menu sits beside the card's link, not inside it - its buttons can't nest in a link.
          <div className="relative" key={resource.id}>
            <Link className="group" href={href}>
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
                <ResourceCardActions
                  editHref={withEditHash(href)}
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
