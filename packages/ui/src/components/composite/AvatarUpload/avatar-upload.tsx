"use client"

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { Pencil } from "lucide-react"
import * as React from "react"

function AvatarUpload({
  alt = "Profile photo",
  className,
  fallback,
  onFileSelect,
  size = "default",
  src,
}: {
  alt?: string
  className?: string
  fallback: React.ReactNode
  onFileSelect?: (file: File) => void
  size?: "default" | "sm" | "lg"
  src?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = React.useState<string | undefined>(undefined)
  const preview = localPreview ?? src

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setLocalPreview(URL.createObjectURL(file))
    onFileSelect?.(file)
    event.target.value = ""
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        aria-label="Upload photo"
        className="cursor-pointer rounded-full"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <Avatar size={size}>
          <AvatarImage alt={alt} src={preview} />
          <AvatarFallback>{fallback}</AvatarFallback>
          <AvatarBadge>
            <Pencil />
          </AvatarBadge>
        </Avatar>
      </button>
      <input
        accept="image/*"
        aria-hidden="true"
        className="sr-only"
        onChange={handleChange}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />
    </div>
  )
}

export { AvatarUpload }
