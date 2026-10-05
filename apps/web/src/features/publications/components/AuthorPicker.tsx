"use client"

import { initialsFromName } from "@repo/shared/utils/initials"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/ui/components/ui"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { useEffect, useState } from "react"
import { searchAuthorCandidates } from "../actions/searchAuthorCandidates"
import type { AuthorCandidate } from "../publications.types"

const SEARCH_DEBOUNCE_MS = 250
const MIN_QUERY_LENGTH = 2

export const candidateName = (member: AuthorCandidate) => `${member.firstName} ${member.lastName}`

/** Institution and position, which tell two members with the same name apart. */
const details = (member: AuthorCandidate) =>
  [member.institution, member.position].filter(Boolean).join(" · ")

const CandidateLabel = ({ member }: { member: AuthorCandidate }) => (
  <span className="flex min-w-0 items-center gap-2">
    {/* The name is beside it, so the photo and initials are decorative. */}
    <Avatar aria-hidden size="sm">
      {member.avatarUrl && <AvatarImage alt="" src={member.avatarUrl} />}
      <AvatarFallback>{initialsFromName(candidateName(member))}</AvatarFallback>
    </Avatar>
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-medium">{candidateName(member)}</span>
      {details(member) && (
        <span className="truncate text-muted-foreground text-xs">{details(member)}</span>
      )}
    </span>
  </span>
)

type AuthorPickerProps = {
  id: string
  label: string
  invalid: boolean
  /** The external author's name. Typing changes it, so a name with no member is kept. */
  value: string
  onChange: (name: string) => void
  onBlur: () => void
  onSelectMember: (member: AuthorCandidate) => void
}

/** A name input that suggests members. Choosing one links the row to that member. */
export const AuthorPicker = ({
  id,
  label,
  invalid,
  value,
  onChange,
  onBlur,
  onSelectMember,
}: AuthorPickerProps) => {
  const [found, setFound] = useState<AuthorCandidate[]>([])
  const [query] = useDebouncedValue(value.trim(), { wait: SEARCH_DEBOUNCE_MS })
  const results = query.length < MIN_QUERY_LENGTH ? [] : found

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) return undefined
    // A slow reply for older text must not replace the results for newer text.
    let current = true
    searchAuthorCandidates(query)
      .then((members) => {
        if (current) setFound(members)
      })
      .catch((error: unknown) => {
        // The name still saves as an external author, so only log it.
        console.error("Could not search members", error)
        if (current) setFound([])
      })
    return () => {
      current = false
    }
  }, [query])

  return (
    <Combobox<AuthorCandidate>
      filter={null}
      inputValue={value}
      items={results}
      itemToStringLabel={candidateName}
      onInputValueChange={(next, { reason }) => {
        // The combobox clears or resets its input when it closes with nothing chosen.
        // Only typing changes the name.
        if (reason === "input-change") onChange(next)
      }}
      onValueChange={(member) => {
        if (member) onSelectMember(member)
      }}
      value={null}
    >
      <ComboboxInput
        aria-invalid={invalid}
        aria-label={label}
        className="w-full"
        id={id}
        onBlur={onBlur}
        placeholder="Search members or type a name"
        showTrigger={false}
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {value.trim().length >= MIN_QUERY_LENGTH &&
            "No members match. This name is saved as an external author."}
        </ComboboxEmpty>
        <ComboboxList>
          {(member: AuthorCandidate) => (
            <ComboboxItem key={member.id} value={member}>
              <CandidateLabel member={member} />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

type LinkedAuthorProps = {
  member: AuthorCandidate
  position: number
  /** Set when the BibTeX import chose this member, so the user checks it. */
  matched?: boolean
  onUnlink: () => void
}

/** A row linked to a member: their profile, and a button to undo the link. */
export const LinkedAuthor = ({ member, position, matched, onUnlink }: LinkedAuthorProps) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border px-2 py-1.5 text-sm">
    <CandidateLabel member={member} />
    <span className="flex shrink-0 items-center gap-2">
      {matched && <Badge variant="blue">Matched from BibTeX</Badge>}
      <Button
        aria-label={`Unlink author ${position} from ${candidateName(member)}`}
        onClick={onUnlink}
        size="sm"
        type="button"
        variant="button-transparent"
      >
        Unlink
      </Button>
    </span>
  </div>
)
