import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext"
import type { Resource } from "@repo/shared/payload-types"
import type { ResourceCardProps } from "@repo/ui/components/composite"
import { Routes } from "@/lib/routes"

type CardResource = Pick<Resource, "createdAt" | "description" | "id" | "owner" | "title"> &
  Partial<Pick<Resource, "course">>

/**
 * What a `ResourceCard` draws of a resource, from one loaded with its owner (and the owner's
 * avatar) populated. A course is only badged when it was loaded too.
 */
export const toResourceCardProps = (resource: CardResource) => {
  const owner = typeof resource.owner === "object" ? resource.owner : undefined
  const avatar = owner?.avatar && typeof owner.avatar === "object" ? owner.avatar : undefined
  const course = typeof resource.course === "object" ? resource.course : undefined

  return {
    course: course?.code,
    href: Routes.RESOURCES.RESOURCE(String(resource.id)),
    owner: {
      avatarSrc: avatar?.url ?? undefined,
      href: owner ? Routes.MEMBERS.MEMBER(owner.id) : undefined,
      name: owner ? `${owner.firstName} ${owner.lastName}` : "Unknown member",
    },
    sharedAt: resource.createdAt,
    summary: convertLexicalToPlaintext({ data: resource.description }).trim() || undefined,
    title: resource.title,
  } satisfies Omit<ResourceCardProps, "linkComponent">
}
