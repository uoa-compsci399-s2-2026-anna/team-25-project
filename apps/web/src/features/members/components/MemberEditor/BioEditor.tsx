"use client"

import type { Member } from "@repo/shared/payload-types"
import { Button, TextArea } from "@repo/ui/components/ui"
import { useEffect, useRef, useState, useTransition } from "react"
import { updateMemberBio } from "../../actions/updateMemberBio"

export const MemberBioEditor = ({ bio }: { bio: Member["bio"] }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(bio ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true)
      return
    }

    startTransition(async () => {
      const result = await updateMemberBio(text)
      if (result.ok) {
        setError(null)
        setIsEditing(false)
      } else {
        setError(result.formError ?? "Could not save your bio. Try again.")
      }
    })
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between">
        <h1 className="font-bold text-muted-foreground text-sm">ABOUT</h1>
        <Button disabled={isPending} onClick={handleClick} variant="button-mauve">
          {isEditing ? (isPending ? "Saving..." : "Done") : "Edit"}
        </Button>
      </div>
      {isEditing ? (
        <TextArea
          className="mt-3"
          disabled={isPending}
          onChange={(e) => setText(e.target.value)}
          ref={inputRef}
          value={text}
        />
      ) : (
        <span className="text-black">{text}</span>
      )}
      {error && <p className="mt-2 text-destructive text-sm">{error}</p>}
    </div>
  )
}
