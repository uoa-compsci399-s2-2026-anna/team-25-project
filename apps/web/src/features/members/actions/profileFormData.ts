export const PROFILE_KEY = "profile"
export const AVATAR_KEY = "avatar"
/** Sent as the avatar to clear the member's saved photo. */
export const REMOVE_AVATAR = "remove"

/** A newly picked photo, REMOVE_AVATAR to clear the saved one, or null to keep it. */
export type AvatarValue = File | typeof REMOVE_AVATAR | null

export const toProfileFormData = ({
  avatar,
  ...profile
}: {
  avatar?: AvatarValue
  [field: string]: unknown
}) => {
  const formData = new FormData()
  formData.set(PROFILE_KEY, JSON.stringify(profile))
  if (avatar) formData.set(AVATAR_KEY, avatar)
  return formData
}
