import type { Publication } from "@repo/shared/payload-types"
import { type CollectionBeforeChangeHook, ValidationError } from "payload"
import { relationID } from "../access/Courses/helpers"
import { member } from "../access/helpers"

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
