"use client"

import { avatarFileError } from "@repo/shared/schemas/members"
import { ALLOWED_AVATAR_MIME_TYPES, MAX_AVATAR_BYTES } from "@repo/shared/schemas/register"
import { AvatarUpload } from "@repo/ui/components/composite"
import type { ReactNode } from "react"
import { type AvatarValue, REMOVE_AVATAR } from "../../actions/profileFormData"
import { EditField, type FieldsOfType } from "./EditField"

export const EditUploadAvatar = ({
  accept = ALLOWED_AVATAR_MIME_TYPES,
  fallback,
  image,
  label = "Profile photo",
  maxBytes = MAX_AVATAR_BYTES,
  name,
  size = "xxl",
  view,
}: {
  accept?: readonly string[]
  fallback: ReactNode
  /** The current photo, shown until a new one is picked. */
  image?: { alt: string; src: string }
  label?: string
  maxBytes?: number
  name: FieldsOfType<AvatarValue>
  size?: "default" | "sm" | "lg" | "xl" | "xxl"
  view?: ReactNode
}) => (
  <EditField
    label={label}
    name={name}
    validate={(file) =>
      file instanceof File ? avatarFileError(file, { accept, maxBytes }) : undefined
    }
    value={null}
    view={view}
  >
    {(control) => (
      <AvatarUpload
        accept={accept.join(",")}
        disabled={control.disabled}
        fallback={fallback}
        image={image}
        // Removing only needs sending when there is a saved photo to clear.
        onFileSelect={(file) => control.setValue(file ?? (image ? REMOVE_AVATAR : null))}
        size={size}
      />
    )}
  </EditField>
)
