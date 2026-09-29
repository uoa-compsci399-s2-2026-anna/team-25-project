"use client"

import { type MemberTitle, MemberTitleLabels } from "@repo/shared/enums/members"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import {
  Button,
  Heading,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui"
import { useEffect, useRef, useState, useTransition } from "react"
import { updateMemberName } from "../../actions/updateMemberName"

// Built from the enum, so the dropdown can only offer approved titles.
const titleOptions = toSelectOptions(MemberTitleLabels)

export const MemberNameEditor = ({
  firstName,
  lastName,
  title,
}: {
  firstName: string
  lastName: string
  title: MemberTitle | null
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [titleValue, setTitleValue] = useState<MemberTitle | null>(title)
  const [first, setFirst] = useState(firstName)
  const [last, setLast] = useState(lastName)
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
      const result = await updateMemberName({ title: titleValue, firstName: first, lastName: last })
      if (result.ok) {
        setError(null)
        setIsEditing(false)
      } else {
        setError(result.formError ?? "Could not save your name. Try again.")
      }
    })
  }

  const fullName = [titleValue && MemberTitleLabels[titleValue], first, last]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="flex flex-col">
      <div className="flex flex-row flex-wrap items-center gap-2">
        {isEditing ? (
          <>
            <Select
              disabled={isPending}
              onValueChange={(value) => setTitleValue(value as MemberTitle | null)}
              value={titleValue}
            >
              <SelectTrigger aria-label="Title" className="w-32">
                <SelectValue placeholder="None">
                  {(value: MemberTitle | null) => (value ? MemberTitleLabels[value] : "None")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                <SelectItem value={null}>None</SelectItem>
                {titleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              aria-label="First name"
              className="w-40"
              disabled={isPending}
              onChange={(e) => setFirst(e.target.value)}
              ref={inputRef}
              value={first}
            />
            <Input
              aria-label="Last name"
              className="w-40"
              disabled={isPending}
              onChange={(e) => setLast(e.target.value)}
              value={last}
            />
          </>
        ) : (
          <Heading level="h1">{fullName}</Heading>
        )}
        <Button disabled={isPending} onClick={handleClick} variant="button-mauve">
          {isEditing ? (isPending ? "Saving..." : "Done") : "Edit"}
        </Button>
      </div>
      {error && <p className="mt-2 text-destructive text-sm">{error}</p>}
    </div>
  )
}
