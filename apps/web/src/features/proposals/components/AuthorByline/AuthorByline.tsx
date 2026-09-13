import type { Institution, Media, Member } from "@repo/shared/payload-types"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"

type AuthorBylineAuthor = Pick<Member, "id" | "firstName" | "lastName"> & {
  avatar?: number | Pick<Media, "id" | "url"> | null
  institution: number | Pick<Institution, "id" | "name">
}

const initials = (firstName: string, lastName: string) =>
  `${[...firstName][0] ?? ""}${[...lastName][0] ?? ""}`.toUpperCase()

const institutionName = (author: AuthorBylineAuthor) =>
  typeof author.institution === "object" ? author.institution.name : null

export const AuthorByline = ({ authors }: { authors: AuthorBylineAuthor[] }) => {
  const names = authors.map((author) => `${author.firstName} ${author.lastName}`).join(", ")

  // don't list the same institution twice if authors share one
  const institutions = [...new Set(authors.map(institutionName).filter(Boolean))].join(", ")

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-3">
        {authors.map((author) => (
          <Avatar className="ring-2 ring-background" key={author.id}>
            {typeof author.avatar === "object" && author.avatar?.url && (
              <AvatarImage alt="" src={author.avatar.url} />
            )}
            <AvatarFallback>{initials(author.firstName, author.lastName)}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className={cn(institutions && "leading-snug")}>
        <p className="font-bold text-sm">{names}</p>
        {institutions && <p className="text-muted-foreground text-sm">{institutions}</p>}
      </div>
    </div>
  )
}
