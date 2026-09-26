import { Skeleton } from "@repo/ui/components/ui"
import Link from "next/link"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { type MembersRouteParams, parseMemberId } from "../members.params"
import { getMemberDetailsCached } from "../members.queries"

export const MemberContacts = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const [member, { user }] = await Promise.all([getMemberDetailsCached(memberId), getCurrentUser()])
  if (!member) return null

  // Mirrors canReadEmail: `showEmailPublicly` only governs signed-out visitors.
  const showEmail = user !== null || member.showEmailPublicly

  return (
    <div className="flex flex-col gap-1 px-6">
      {showEmail && (
        <Link className="underline underline-offset-2" href={`mailto:${member.email}`}>
          {member.email}
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

export const MemberContactsSkeleton = () => <Skeleton className="h-48 w-full" />
