"use client"

import { registerProfileSchema } from "@repo/shared/schemas/register"
import { AvatarUpload } from "@repo/ui/components/composite"
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Separator,
  TextArea,
} from "@repo/ui/components/ui"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Routes } from "@/lib/routes"
import { completeProfile } from "../actions/register"

export const RegisterProfileForm = ({ initials }: { initials: string }) => {
  const router = useRouter()
  const [avatar, setAvatar] = useState<File | undefined>(undefined)
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const form = useForm({
    defaultValues: { bio: "", position: "" },
    onSubmit: async ({ value }) => {
      setFieldErrors({})
      setFormError(undefined)

      const formData = new FormData()
      formData.set("bio", value.bio)
      formData.set("position", value.position)
      if (avatar) formData.set("avatar", avatar)

      const result = await completeProfile(formData)

      if (result.ok) {
        router.push(Routes.HOME)
        return
      }

      setFieldErrors(result.fieldErrors ?? {})
      setFormError(result.formError)
    },
    validators: { onSubmit: registerProfileSchema },
  })

  return (
    <form
      className="flex flex-col gap-8"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <AvatarUpload fallback={initials} onFileSelect={setAvatar} size="xl" />
        <p className="font-medium text-sm">Photo</p>
        <p className="text-muted-foreground text-xs">
          {avatar ? avatar.name : "Optional - you can add one later"}
        </p>
      </div>

      <FieldGroup>
        <form.Field name="position">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
              <FieldLabel htmlFor={field.name}>Position</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Senior Lecturer"
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors} />
              {fieldErrors.position && <FieldError>{fieldErrors.position}</FieldError>}
            </Field>
          )}
        </form.Field>

        <form.Field name="bio">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
              <FieldLabel htmlFor={field.name}>About you</FieldLabel>
              <TextArea
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="A sentence or two on what you teach and what you're researching"
                value={field.state.value}
              />
              <FieldDescription>This is what other members see in the directory.</FieldDescription>
              <FieldError errors={field.state.meta.errors} />
              {fieldErrors.bio && <FieldError>{fieldErrors.bio}</FieldError>}
            </Field>
          )}
        </form.Field>
      </FieldGroup>

      <Separator />

      {formError && <FieldError>{formError}</FieldError>}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-48 text-muted-foreground text-sm">
          You can finish this later from your profile.
        </p>
        <Button size="lg" type="submit" variant="button-mauve">
          Finish & enter CCCA
        </Button>
      </div>
    </form>
  )
}
