import { Badge, Card, CardContent, CardHeader, Heading, Skeleton } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { FolderOpen } from "lucide-react"
import Link from "next/link"
import { EmptyState } from "@/components/EmptyState"
import { withRedirect } from "@/features/auth/redirect"
import { formatDate } from "@/features/courses/courses.format"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"
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
        <ResourceList resources={await getMemberResourcesCached(memberId)} />
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

const ResourceList = ({ resources }: { resources: MemberResource[] }) => {
  if (resources.length === 0) {
    return (
      <EmptyState className="border p-6" icon={<FolderOpen />} title="No resources shared yet" />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {resources.map((resource) => {
        const shared = formatDate(resource.createdAt)
        const course = typeof resource.course === "object" ? resource.course : undefined
        const attachments = resource.attachments?.length ?? 0

        return (
          <Link className="group" href={resourceHref(String(resource.id))} key={resource.id}>
            <Card className="transition-colors group-hover:ring-foreground/25">
              <CardHeader className="flex items-center justify-between gap-3">
                <Badge variant="blue">{course?.code ?? "Resource"}</Badge>
                {shared && <span className="text-muted-foreground text-xs">Shared {shared}</span>}
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <span className="font-medium group-hover:underline">{resource.title}</span>
                {attachments > 0 && (
                  <span className="text-muted-foreground text-xs">
                    {attachments === 1 ? "1 attachment" : `${attachments} attachments`}
                  </span>
                )}
              </CardContent>
            </Card>
          </Link>
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
