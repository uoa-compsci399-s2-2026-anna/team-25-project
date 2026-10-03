import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Publication } from "@repo/shared/payload-types"
import { revalidateTag } from "next/cache"
import {
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type CollectionBeforeChangeHook,
  type FieldHook,
  ValidationError,
} from "payload"
import { relationID } from "../access/Courses/helpers"
import { member } from "../access/helpers"

// Postgres allows many NULLs in a unique index but only one "",
// so a cleared optional unique field must be stored as NULL.
export const blankToNull: FieldHook = ({ value }) =>
  typeof value === "string" && !value.trim() ? null : value

// Members can only edit publications that link them as an author,
// so a member must stay linked after every save.
export const requireLinkedAuthor: CollectionBeforeChangeHook<Publication> = ({
  data,
  originalDoc,
  req,
}) => {
  if (!member(req)) return data

  const authors = data.authors ?? originalDoc?.authors ?? []
  if (authors.some((author) => relationID(author.member) === req.user?.id)) return data

  throw new ValidationError({
    errors: [{ path: "authors", message: "Link yourself as one of the authors." }],
    req,
  })
}

const linkedMemberIDs = (...docs: (Publication | undefined)[]) =>
  new Set(
    docs
      .flatMap((doc) => doc?.authors ?? [])
      .map((author) => relationID(author.member))
      .filter((id) => id !== undefined),
  )

// Linked authors' profiles list their publications, so must revalidate
const revalidatePublication = (doc: Publication, previousDoc?: Publication) => {
  revalidateTag(QueryKeys.PUBLICATIONS.ROOT, "max")
  revalidateTag(QueryKeys.PUBLICATIONS.ID(doc.id), "max")
  for (const memberID of linkedMemberIDs(doc, previousDoc)) {
    revalidateTag(QueryKeys.MEMBERS.ID(memberID), "max")
  }
}

export const revalidatePublications: CollectionAfterChangeHook<Publication> = ({
  doc,
  previousDoc,
  req,
}) => {
  if (!req.context.disableRevalidate) revalidatePublication(doc, previousDoc)
  return doc
}

export const revalidateDeletedPublication: CollectionAfterDeleteHook<Publication> = ({
  doc,
  req,
}) => {
  if (!req.context.disableRevalidate) revalidatePublication(doc)
  return doc
}
