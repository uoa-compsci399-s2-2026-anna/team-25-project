"use client"

import { ALLOWED_AVATAR_MIME_TYPES } from "@repo/shared/schemas/register"
import { AvatarUpload } from "@repo/ui/components/composite"
import { useState, useTransition } from "react"
import { updateMemberAvatar } from "../../actions/updateMemberAvatar"

// Matches next.config.ts's serverActions.bodySizeLimit - checked here too so a
// large photo gets a clear message instead of the request failing silently.
const MAX_AVATAR_BYTES = 4 * 1024 * 1024

// Picking a file is the confirmation, so there's no Edit/Done step - it uploads straight away.
export const MemberAvatarEditor = ({
  fallback,
  image,
}: {
  fallback: string
  image?: { alt: string; src: string }
}) => {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleFile = (file: File) => {
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Your photo must be 4 MB or smaller.")
      return
    }

    const formData = new FormData()
    formData.set("avatar", file)

    startTransition(async () => {
      const result = await updateMemberAvatar(formData)
      if (result.ok) {
        setError(null)
      } else {
        setError(result.formError ?? "Could not save your photo. Try again.")
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <AvatarUpload
        accept={ALLOWED_AVATAR_MIME_TYPES.join(",")}
        fallback={<span className="text-3xl">{fallback}</span>}
        image={image}
        onFileSelect={handleFile}
        size="xxl"
      />
      {isPending && <p className="text-muted-foreground text-xs">Uploading...</p>}
      {error && <p className="max-w-40 text-center text-destructive text-sm">{error}</p>}
    </div>
  )
}
