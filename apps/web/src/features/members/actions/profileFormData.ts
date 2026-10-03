export const PROFILE_KEY = "profile"
export const AVATAR_KEY = "avatar"

export const toProfileFormData = ({
  avatar,
  ...profile
}: {
  avatar?: File | null
  [field: string]: unknown
}) => {
  const formData = new FormData()
  formData.set(PROFILE_KEY, JSON.stringify(profile))
  if (avatar) formData.set(AVATAR_KEY, avatar)
  return formData
}
