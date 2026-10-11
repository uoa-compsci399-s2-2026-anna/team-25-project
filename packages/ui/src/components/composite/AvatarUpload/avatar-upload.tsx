"use client"

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage, Button } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { Pencil } from "lucide-react"
import * as React from "react"

function AvatarUpload({
  accept = "image/*",
  className,
  disabled,
  fallback,
  image,
  onFileSelect,
  size = "default",
}: {
  accept?: string
  className?: string
  disabled?: boolean
  fallback: React.ReactNode
  image?: { alt: string; src: string }
  onFileSelect?: (file: File | undefined) => void
  size?: "default" | "sm" | "lg" | "xl" | "xxl"
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = React.useState<string | undefined>(undefined)
  const preview = localPreview ?? image?.src

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setLocalPreview(URL.createObjectURL(file))
    onFileSelect?.(file)
    event.target.value = ""
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <div className="flex flex-col items-center gap-2">
        <button
          aria-label="Upload photo"
          className="cursor-pointer rounded-full disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <Avatar size={size}>
            <AvatarImage alt={image?.alt ?? "Profile photo"} src={preview} />
            <AvatarFallback>{fallback}</AvatarFallback>
            <AvatarBadge>
              <Pencil />
            </AvatarBadge>
          </Avatar>
        </button>
        {localPreview && (
          <Button
            className="bg-red-500 text-white"
            disabled={disabled}
            onClick={() => {
              setLocalPreview(undefined)
              onFileSelect?.(undefined)
            }}
            size="sm"
          >
            Remove
          </Button>
        )}
      </div>
      <input
        accept={accept}
        aria-hidden="true"
        className="sr-only"
        disabled={disabled}
        onChange={handleChange}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />
    </div>
  )
}

export { AvatarUpload }
