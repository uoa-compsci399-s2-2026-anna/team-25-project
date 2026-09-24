import { Skeleton } from "@repo/ui/components/ui"
import Link from "next/link"
import { getMemberDetailsCached } from "../member.queries"
import { type MembersRouteParams, parseMemberId } from "../members.params"

export const MemberContacts = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const member = await getMemberDetailsCached(memberId)
  if (!member) return null

  return (
    <div className="flex flex-col gap-1 px-6">
      {member.showEmailPublicly && (
        <Link className="underline underline-offset-2" href={`mailto:${member.email}`}>
          {member.email}
        </Link>
      )}
      {/* TODO: link the staff page and ORCID once Members has fields for them */}
      <div className="flex flex-col gap-1 text-brand-mauve">
        <Link href="/">Staff page</Link>
        <Link href="/">ORCID</Link>
      </div>
    </div>
  )
}

export const MemberContactsSkeleton = () => <Skeleton className="h-48 w-full" />
