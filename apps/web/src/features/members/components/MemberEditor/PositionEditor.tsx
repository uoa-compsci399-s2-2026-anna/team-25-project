"use client"

import type { Member } from "@repo/shared/payload-types"
import { Button, Input } from "@repo/ui/components/ui"
import { useEffect, useRef, useState, useTransition } from "react"
import { updateMemberPosition } from "../../actions/updateMemberPosition"

// `rest` is the read-only "Institution - Country" tail of the affiliation line.
export const MemberPositionEditor = ({
  position,
  rest,
}: {
  position: Member["position"]
  rest: string
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(position ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true)
      return
    }

    startTransition(async () => {
      const result = await updateMemberPosition(text)
      if (result.ok) {
        setError(null)
        setIsEditing(false)
      } else {
        setError(result.formError ?? "Could not save your position. Try again.")
      }
    })
  }

  const affiliation = [text.trim(), rest].filter(Boolean).join(" - ")

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center gap-2">
        {isEditing ? (
          <>
            <Input
              aria-label="Position"
              className="max-w-xs"
              disabled={isPending}
              maxLength={100}
              onChange={(e) => setText(e.target.value)}
              ref={inputRef}
              value={text}
            />
            {rest && <span className="text-muted-foreground">- {rest}</span>}
          </>
        ) : (
          <p className="text-muted-foreground">{affiliation || "Add your position"}</p>
        )}
        <Button disabled={isPending} onClick={handleClick} variant="button-mauve">
          {isEditing ? (isPending ? "Saving..." : "Done") : "Edit"}
        </Button>
      </div>
      {error && <p className="mt-2 text-destructive text-sm">{error}</p>}
    </div>
  )
}
