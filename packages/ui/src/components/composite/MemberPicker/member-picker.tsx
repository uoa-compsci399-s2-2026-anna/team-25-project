"use client"

import { initialsFromName } from "@repo/shared/utils/initials"
import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/Avatar/avatar"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../../ui/Combobox/combobox"

/** A member as the picker shows them. */
export type MemberOption = {
  readonly id: number
  readonly firstName: string
  readonly lastName: string
  readonly position?: string
  readonly institution?: string
  readonly avatarUrl?: string
}

/**
 * Resolves to the members that fit the text, leaving out `exclude`, or the reason the
 * search could not run.
 */
export type MemberSearch = (
  query: string,
  exclude: readonly number[],
) => Promise<MemberOption[] | { error: string }>

const SEARCH_DEBOUNCE_MS = 250
const MIN_QUERY_LENGTH = 2
const SEARCH_FAILED = "Could not search members. Try again."
// A stable default, so the search does not run again on each render.
const NO_MEMBERS: readonly number[] = []

export const memberName = (member: MemberOption) => `${member.firstName} ${member.lastName}`

/** Institution and position, which tell two members with the same name apart. */
const details = (member: MemberOption) =>
  [member.institution, member.position].filter(Boolean).join(" · ")

export const MemberLabel = ({ member }: { member: MemberOption }) => (
  <span className="flex min-w-0 items-center gap-2">
    {/* The name is beside it, so the photo and initials are decorative. */}
    <Avatar aria-hidden size="sm">
      {member.avatarUrl && <AvatarImage alt="" src={member.avatarUrl} />}
      <AvatarFallback>{initialsFromName(memberName(member))}</AvatarFallback>
    </Avatar>
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-medium text-sm">{memberName(member)}</span>
      {details(member) && (
        <span className="truncate text-muted-foreground text-xs">{details(member)}</span>
      )}
    </span>
  </span>
)

export type MemberPickerProps = {
  id?: string
  label: string
  placeholder?: string
  onSearch: MemberSearch
  onSelect: (member: MemberOption) => void
  /** Members already chosen, left out of the results. Keep the array stable between renders. */
  exclude?: readonly number[]
  disabled?: boolean
}

/** A search box that only accepts a member. Choosing one clears it for the next. */
export function MemberPicker({
  id,
  label,
  placeholder = "Search members",
  onSearch,
  onSelect,
  exclude = NO_MEMBERS,
  disabled,
}: MemberPickerProps) {
  // The popup lines up with the whole input box, not just the text field inside it.
  const anchorRef = React.useRef<HTMLDivElement>(null)
  const [text, setText] = React.useState("")
  // Each reply keeps its query, so the list never shows members for older text.
  const [found, setFound] = React.useState<{
    query: string
    result: Awaited<ReturnType<MemberSearch>>
  } | null>(null)
  const typed = text.trim()
  const searchable = typed.length >= MIN_QUERY_LENGTH
  const reply = searchable && found?.query === typed ? found : undefined
  const members = Array.isArray(reply?.result) ? reply.result : []
  const results = members.filter((member) => !exclude.includes(member.id))

  React.useEffect(() => {
    if (typed.length < MIN_QUERY_LENGTH) return undefined
    // A slow reply for older text must not replace the results for newer text.
    let current = true
    const timer = setTimeout(() => {
      onSearch(typed, exclude)
        .then((result) => {
          if (current) setFound({ query: typed, result })
        })
        .catch((error: unknown) => {
          console.error("Could not search members", error)
          if (current) setFound({ query: typed, result: { error: SEARCH_FAILED } })
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [typed, exclude, onSearch])

  const emptyMessage = !reply
    ? "Searching…"
    : Array.isArray(reply.result)
      ? "No members match."
      : reply.result.error

  return (
    <Combobox<MemberOption>
      disabled={disabled}
      filter={null}
      inputValue={text}
      items={results}
      itemToStringLabel={memberName}
      onInputValueChange={(next, { reason }) => {
        // The combobox clears or resets its input when it closes with nothing chosen.
        if (reason === "input-change") setText(next)
      }}
      onValueChange={(member) => {
        if (!member) return
        onSelect(member)
        setText("")
      }}
      value={null}
    >
      <div ref={anchorRef}>
        <ComboboxInput
          aria-label={label}
          className="w-full"
          id={id}
          placeholder={placeholder}
          showTrigger={false}
        />
      </div>
      <ComboboxContent anchor={anchorRef} className="min-w-(--anchor-width)">
        <ComboboxEmpty>{searchable && emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(member: MemberOption) => (
            <ComboboxItem key={member.id} value={member}>
              <MemberLabel member={member} />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
