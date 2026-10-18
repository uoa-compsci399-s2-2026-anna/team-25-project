import type { memberProfileSchema } from "@repo/shared/schemas/members"
import type { ComponentProps } from "react"
import type { z } from "zod"
import { createEditFields, type TypedEdit } from "@/components/Editor/createEditFields"
import type { AvatarValue } from "../../actions/profileFormData"
import { EditUploadAvatar } from "./EditUploadAvatar"

/**
 * Every profile attribute an Edit component can bind to, keyed by form field name.
 * Derived from the schema so a field added there can't be missed here.
 */
export type ProfileValues = Required<z.input<typeof memberProfileSchema>> & {
  avatar: AvatarValue
}

const UploadAvatar: TypedEdit<
  ComponentProps<typeof EditUploadAvatar>,
  ProfileValues,
  AvatarValue
> = EditUploadAvatar

/** The Edit controls for a member profile, e.g. <MemberEdit.Input name="bio" />. */
export const MemberEdit = { ...createEditFields<ProfileValues>(), UploadAvatar }
