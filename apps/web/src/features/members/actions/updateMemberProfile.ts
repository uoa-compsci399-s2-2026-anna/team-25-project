"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { avatarFileError, memberProfileSchema } from "@repo/shared/schemas/members"
import { updateTag } from "next/cache"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { AVATAR_KEY, PROFILE_KEY, REMOVE_AVATAR } from "./profileFormData"

const BROKEN_REQUEST = "Something went wrong sending your changes. Refresh and try again."

/** The profile JSON from the form, or undefined when it's missing or not valid JSON. */
const readProfile = (formData: FormData): unknown => {
  const raw = formData.get(PROFILE_KEY)
  if (typeof raw !== "string") return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

export const updateMemberProfile = async (formData: FormData): Promise<ActionResult> => {
  const { collection, user } = await getCurrentUser()
  if (!user || collection !== Slugs.Collections.MEMBERS) {
    return { formError: "Sign in as a member to edit your profile.", ok: false }
  }

  const profile = readProfile(formData)
  if (profile === undefined) return { formError: BROKEN_REQUEST, ok: false }

  const parsed = memberProfileSchema.safeParse(profile)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".")
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
    }
    // An issue without a field (e.g. the JSON isn't an object) means a broken request, not a user mistake.
    const [firstFieldError] = Object.values(fieldErrors)
    return { fieldErrors, formError: firstFieldError ?? BROKEN_REQUEST, ok: false }
  }

  const avatar = formData.get(AVATAR_KEY)
  const newAvatar = avatar instanceof File && avatar.size > 0 ? avatar : null
  const removeAvatar = avatar === REMOVE_AVATAR
  if (newAvatar) {
    const avatarError = avatarFileError(newAvatar)
    if (avatarError)
      return { fieldErrors: { avatar: avatarError }, formError: avatarError, ok: false }
  }

  const payload = await getPayloadClient()

  // The photo is uploaded first so the member can point at it in the same update.
  let avatarId: number | undefined
  if (newAvatar) {
    try {
      const media = await payload.create({
        collection: Slugs.Collections.MEDIA,
        data: { alt: `${user.firstName} ${user.lastName}` },
        file: {
          data: Buffer.from(await newAvatar.arrayBuffer()),
          mimetype: newAvatar.type,
          name: newAvatar.name,
          size: newAvatar.size,
        },
        overrideAccess: false,
        user,
      })
      avatarId = media.id
    } catch (error) {
      payload.logger.error({ err: error }, "updateMemberProfile avatar upload failed")
      return { formError: "Could not upload your photo. Try again.", ok: false }
    }
  }

  // A new photo wins over a removal; with neither, the avatar is left out so it's kept.
  const avatarChange =
    avatarId !== undefined ? { avatar: avatarId } : removeAvatar ? { avatar: null } : {}

  try {
    await payload.update({
      collection: Slugs.Collections.MEMBERS,
      id: user.id,
      data: { ...parsed.data, ...avatarChange },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    payload.logger.error({ err: error }, "updateMemberProfile failed")
    // Nothing points at the new upload, so remove it rather than leave an orphan.
    // Media deletes are admin-only, so this skips access: the ID is the upload made above.
    if (avatarId !== undefined) {
      await payload
        .delete({ collection: Slugs.Collections.MEDIA, id: avatarId })
        .catch((err) => payload.logger.error({ err }, "orphaned avatar cleanup failed"))
    }
    return { formError: "Could not save your changes. Try again.", ok: false }
  }

  // Only once the member no longer points at the old photo is it safe to delete.
  // The ID comes from the signed-in member's own record, so this skips access too.
  const previousAvatarId = typeof user.avatar === "object" ? user.avatar?.id : user.avatar
  if ("avatar" in avatarChange && previousAvatarId && previousAvatarId !== avatarId) {
    await payload
      .delete({ collection: Slugs.Collections.MEDIA, id: previousAvatarId })
      .catch((err) => payload.logger.error({ err }, "previous avatar cleanup failed"))
  }

  updateTag(QueryKeys.MEMBERS.ID(user.id))

  return { ok: true }
}
