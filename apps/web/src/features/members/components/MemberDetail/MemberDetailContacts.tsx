import { Skeleton } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import Link from "next/link"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"
import { isOwnProfile } from "../../members.ownership"
import { type MembersRouteParams, parseMemberId } from "../../members.params"
import { getMemberDetailsCached } from "../../members.queries"
import { mobileSection } from "./mobileSection"

export const MemberContacts = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const [member, { user }, isOwn] = await Promise.all([
    getMemberDetailsCached(memberId),
    getCurrentUser(),
    isOwnProfile(memberId),
  ])
  if (!member) return null

  const showEmail = user !== null || member.showEmailPublicly
  // biome-ignore lint/nursery/useReactCompiler: FORGOT builds a route, it isn't a component
  const resetPasswordHref = Routes.PASSWORD.FORGOT(member.email)

  return (
    <div
      className={cn(
        "flex flex-col gap-1 max-md:order-2 max-md:items-center max-md:empty:hidden md:px-6",
        mobileSection,
      )}
    >
      {showEmail && (
        <Link className="underline underline-offset-2" href={`mailto:${member.email}`}>
          {member.email}
        </Link>
      )}
      {/* Signed-in members have no other way to change their password yet. */}
      {isOwn && (
        <Link
          className="text-muted-foreground text-sm underline underline-offset-2"
          href={resetPasswordHref}
        >
          Reset password
        </Link>
      )}
      {member.links && member.links.length > 0 && (
        <div className="flex flex-col gap-1 text-brand-mauve">
          {member.links.map((link) => (
            <a href={link.url} key={link.id ?? link.url} rel="noopener noreferrer" target="_blank">
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export const MemberContactsSkeleton = () => (
  <div className={cn("max-md:order-2", mobileSection)}>
    <Skeleton className="h-48 w-full max-md:h-12" />
  </div>
)
