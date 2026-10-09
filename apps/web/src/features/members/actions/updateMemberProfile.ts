"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { avatarFileError, memberProfileSchema } from "@repo/shared/schemas/members"
import { updateTag } from "next/cache"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { AVATAR_KEY, PROFILE_KEY } from "./profileFormData"

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

  try {
    await payload.update({
      collection: Slugs.Collections.MEMBERS,
      id: user.id,
      data: avatarId === undefined ? parsed.data : { ...parsed.data, avatar: avatarId },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    payload.logger.error({ err: error }, "updateMemberProfile failed")
    // Nothing points at the new upload, so remove it rather than leave an orphan.
    if (avatarId !== undefined) {
      await payload
        .delete({ collection: Slugs.Collections.MEDIA, id: avatarId, user, overrideAccess: false })
        .catch((err) => payload.logger.error({ err }, "orphaned avatar cleanup failed"))
    }
    return { formError: "Could not save your changes. Try again.", ok: false }
  }

  updateTag(QueryKeys.MEMBERS.ID(user.id))

  return { ok: true }
}
