"use client"

import { useForm } from "@tanstack/react-form"
import { createContext, type ReactNode, useContext, useState } from "react"
import type { z } from "zod"

/**
 * The values an Edit component can bind to, keyed by form field name. Typed loosely so
 * one editor serves every feature - createEditFields types each feature's field names.
 */
export type EditValues = Record<string, unknown>

type FormErrors = { fields: Record<string, { message: string }> } | undefined
type Validate = (args: { value: EditValues }) => FormErrors
type SaveResult = { ok: boolean; formError?: string }

/** Turns a zod schema into a form validator that puts each issue on its field. */
export const zodFormErrors =
  (schema: z.ZodType): Validate =>
  ({ value }) => {
    const result = schema.safeParse(value)
    if (result.success) return undefined

    const fields: Record<string, { message: string }> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join(".")
      if (field && !fields[field]) fields[field] = { message: issue.message }
    }
    return { fields }
  }

const useEditForm = (
  validate: Validate,
  onSave: (values: EditValues) => Promise<SaveResult>,
  onSaved: () => void,
  onError: (message: string) => void,
) =>
  useForm({
    // Left empty on purpose: each field fills itself in from the server value when it appears.
    defaultValues: {} as EditValues,
    // The form won't submit while any field has an error.
    validators: { onChange: validate },
    onSubmit: async ({ value }) => {
      try {
        const result = await onSave(value)
        if (result.ok) onSaved()
        else onError(result.formError ?? "Could not save. Try again.")
      } catch {
        onError("An unexpected error occurred. Please try again.")
      }
    },
  })

export type EditForm = ReturnType<typeof useEditForm>

type EditContextValue = {
  form: EditForm
  isEditing: boolean
  error: string | null
  startEditing: () => void
  cancel: () => void
}

const EditContext = createContext<EditContextValue | null>(null)

export const EditProvider = <T extends EditValues>({
  children,
  onSave,
  validate,
}: {
  children: ReactNode
  /** Persists the edited values - called on Done once validation passes. */
  onSave: (values: Partial<T>) => Promise<SaveResult>
  validate: Validate
}) => {
  const [isEditing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useEditForm(
    validate,
    // The form only holds the fields on screen, and createEditFields names those from T.
    (values) => onSave(values as Partial<T>),
    () => {
      setError(null)
      setEditing(false)
    },
    setError,
  )

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
