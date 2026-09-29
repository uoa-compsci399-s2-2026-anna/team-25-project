"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { ALLOWED_AVATAR_MIME_TYPES } from "@repo/shared/schemas/register"
import { updateTag } from "next/cache"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

// Matches next.config.ts's serverActions.bodySizeLimit.
const MAX_AVATAR_BYTES = 4 * 1024 * 1024

// A File can't be passed to a server action on its own - it travels inside FormData.
export const updateMemberAvatar = async (formData: FormData): Promise<ActionResult> => {
  const { collection, user } = await getCurrentUser()
  if (!user || collection !== Slugs.Collections.MEMBERS) {
    return { formError: "Sign in as a member to change your photo.", ok: false }
  }

  const avatar = formData.get("avatar")
  if (!(avatar instanceof File) || avatar.size === 0) {
    return { formError: "Choose a photo to upload.", ok: false }
  }
  if (!ALLOWED_AVATAR_MIME_TYPES.includes(avatar.type)) {
    return { formError: "Please upload a JPG, PNG, GIF or WEBP image.", ok: false }
  }
  if (avatar.size > MAX_AVATAR_BYTES) {
    return { formError: "Your photo must be 4 MB or smaller.", ok: false }
  }

  const payload = await getPayloadClient()
  let avatarId: number

  try {
    const media = await payload.create({
      collection: Slugs.Collections.MEDIA,
      data: { alt: `${user.firstName} ${user.lastName}` },
      file: {
        data: Buffer.from(await avatar.arrayBuffer()),
        mimetype: avatar.type,
        name: avatar.name,
        size: avatar.size,
      },
      overrideAccess: false,
      user,
    })
    avatarId = media.id
  } catch (error) {
    payload.logger.error({ err: error }, "avatar upload failed")
    return { formError: "Could not upload your photo. Try again.", ok: false }
  }

  try {
    await payload.update({
      collection: Slugs.Collections.MEMBERS,
      id: user.id,
      data: { avatar: avatarId },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    payload.logger.error({ err: error }, "updateMemberAvatar failed")
    return { formError: "Could not save your photo. Try again.", ok: false }
  }

  updateTag(QueryKeys.MEMBERS.ID(user.id))

  return { ok: true }
}
