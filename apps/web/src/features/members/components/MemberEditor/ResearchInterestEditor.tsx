"use client"

import type { Member } from "@repo/shared/payload-types"
import { Badge, Button, Input } from "@repo/ui/components/ui"
import { useState, useTransition } from "react"
import { updateMemberResearchInterests } from "../../actions/updateMemberResearchInterests"

export const MemberResearchInterestEditor = ({
  interests,
}: {
  interests: Member["researchInterests"]
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [items, setItems] = useState<string[]>(interests ?? [])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const updateItem = (index: number, value: string) =>
    setItems(items.map((item, i) => (i === index ? value : item)))

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const addItem = () => setItems([...items, ""])

  // Same one-button pattern as BioEditor: first click starts editing, second click saves.
  const handleClick = () => {
    if (!isEditing) {
      // Start from the saved list every time, so leftover unsaved edits don't reappear.
      setItems(interests ?? [])
      setError(null)
      setIsEditing(true)
      return
    }

    const cleaned = items.map((item) => item.trim()).filter(Boolean)

    startTransition(async () => {
      const result = await updateMemberResearchInterests(cleaned)
      if (result.ok) {
        setError(null)
        setIsEditing(false)
      } else {
        setError(result.formError ?? "Could not save your research interests. Try again.")
      }
    })
  }

  return (
    <div>
      <ul className="flex flex-wrap gap-1">
        {isEditing
          ? items.map((item, index) => (
              // The index, not the text, is the key - the text changes on every keystroke.
              // biome-ignore lint/suspicious/noArrayIndexKey: see above
              <li key={index}>
                <Badge className="h-7 pl-1">
                  <Button
                    className="bg-destructive text-white"
                    onClick={() => removeItem(index)}
                    size="icon-xs"
                    variant="button-unstyled"
                  >
                    -
                  </Button>
                  <Input
                    className="h-auto w-24 border-0 px-1 font-medium hover:bg-transparent focus-visible:ring-0"
                    onChange={(e) => updateItem(index, e.target.value)}
                    value={item}
                    variant="pill"
                  />
                </Badge>
              </li>
            ))
          : (interests ?? []).map((interest) => (
              <li key={interest}>
                <Badge>{interest}</Badge>
              </li>
            ))}
        {isEditing && (
          <li>
            <Button onClick={addItem} size="icon-xs" variant="button-cream">
              +
            </Button>
          </li>
        )}
      </ul>
      {error && <p className="mt-2 text-destructive text-sm">{error}</p>}
      <Button className="mt-2" disabled={isPending} onClick={handleClick} variant="button-mauve">
        {isEditing ? (isPending ? "Saving..." : "Done") : "Edit"}
      </Button>
    </div>
  )
}
