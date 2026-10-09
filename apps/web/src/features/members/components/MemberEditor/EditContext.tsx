"use client"

import { memberProfileSchema } from "@repo/shared/schemas/members"
import { useForm } from "@tanstack/react-form"
import { createContext, type ReactNode, useContext, useState } from "react"
import type { z } from "zod"
import { toProfileFormData } from "../../actions/profileFormData"
import { updateMemberProfile } from "../../actions/updateMemberProfile"

/**
 * Every profile attribute an Edit component can bind to, keyed by form field name.
 * Derived from the schema so a field added there can't be missed here.
 */
export type ProfileValues = Required<z.input<typeof memberProfileSchema>> & {
  /** A newly picked photo, or null to keep the current one. */
  avatar: File | null
}

const validateProfile = ({ value }: { value: ProfileValues }) => {
  const result = memberProfileSchema.safeParse(value)
  if (result.success) return undefined

  const fields: Record<string, { message: string }> = {}
  for (const issue of result.error.issues) {
    const field = issue.path.join(".")
    if (field && !fields[field]) fields[field] = { message: issue.message }
  }
  return { fields }
}

const useProfileForm = (onSaved: () => void, onError: (message: string) => void) =>
  useForm({
    // Left empty on purpose: each field fills itself in from the server value when it appears.
    defaultValues: {} as ProfileValues,
    // The form won't submit while any field has an error.
    validators: { onChange: validateProfile },
    onSubmit: async ({ value }) => {
      try {
        const result = await updateMemberProfile(toProfileFormData(value))
        if (result.ok) onSaved()
        else onError(result.formError ?? "Could not save. Try again.")
      } catch {
        onError("An unexpected error occurred. Please try again.")
      }
    },
  })

export type ProfileForm = ReturnType<typeof useProfileForm>

type EditContextValue = {
  form: ProfileForm
  isEditing: boolean
  error: string | null
  startEditing: () => void
  cancel: () => void
}

const EditContext = createContext<EditContextValue | null>(null)

export const EditProvider = ({ children }: { children: ReactNode }) => {
  const [isEditing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useProfileForm(() => {
    setError(null)
    setEditing(false)
  }, setError)

  const startEditing = () => {
    form.reset()
    setError(null)
    setEditing(true)
  }

  const cancel = () => {
    form.reset()
    setError(null)
    setEditing(false)
  }

  return (
    <EditContext.Provider value={{ form, isEditing, error, startEditing, cancel }}>
      {children}
    </EditContext.Provider>
  )
}

export const useEdit = () => {
  const edit = useContext(EditContext)
  if (!edit) throw new Error("useEdit must be used inside <EditProvider>")
  return edit
}
