"use client"

import { resetPasswordSchema } from "@repo/shared/schemas/passwordReset"
import { validateField } from "@repo/shared/utils/validate-field"
import { Button, Field, FieldError, FieldGroup, FieldLabel, Heading } from "@repo/ui/components/ui"
import { useForm } from "@tanstack/react-form"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type ReactNode, useState } from "react"
import { Routes } from "@/lib/routes"
import { resetPassword } from "../actions/resetPassword"
import { PasswordField } from "./PasswordField"

const passwordSchema = resetPasswordSchema.pick({ password: true })

// Built once here: it takes no input, and a call in render reads as a component call to lint.
const requestNewLinkHref = Routes.PASSWORD.FORGOT()

/** Both states share one frame, so swapping between them doesn't shift the page. */
const ResetLayout = ({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) => (
  <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-20">
    <div className="flex flex-col gap-3 text-center">
      <Heading level="h1">{title}</Heading>
      <p className="text-muted-foreground">{description}</p>
    </div>
    {children}
  </main>
)

/**
 * Replaces the whole page for a link that has expired or was already used - a
 * "set a new password" heading above it would promise something it can't do.
 */
export const ResetLinkInvalid = () => (
  <ResetLayout
    description="Reset links work once, for an hour after they're sent."
    title="This link has expired"
  >
    <Button
      className="w-full"
      nativeButton={false}
      render={<Link href={requestNewLinkHref} />}
      size="xl"
      variant="button-mauve"
    >
      Request a new link
    </Button>
  </ResetLayout>
)

export const ResetPasswordForm = ({ token }: { token: string }) => {
  const router = useRouter()
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [fieldError, setFieldError] = useState<string | undefined>(undefined)
  // The page checked the link on load, but it can still run out before submit.
  const [linkInvalid, setLinkInvalid] = useState(false)

  const form = useForm({
    defaultValues: { password: "" },
    onSubmit: async ({ value }) => {
      setFormError(undefined)
      setFieldError(undefined)

      try {
        const result = await resetPassword({ password: value.password, token })

        if (result.ok) {
          router.refresh()
          router.push(Routes.HOME)
          return
        }

        if ("invalidToken" in result) {
          setLinkInvalid(true)
          return
        }

        setFieldError(result.fieldErrors?.password)
        setFormError(result.formError)
      } catch {
        setFormError("We couldn't reset your password. Try again.")
      }
    },
    validators: { onSubmit: passwordSchema },
  })

  if (linkInvalid) return <ResetLinkInvalid />

  return (
    <ResetLayout
      description="Choose a new password. You'll be logged in once it's saved, and signed out everywhere else."
      title="Set a new password"
    >
      <form
        className="flex flex-col gap-8"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          form.handleSubmit()
        }}
      >
        <FieldGroup>
          <form.Field
            name="password"
            validators={{ onBlur: validateField(passwordSchema.shape.password) }}
          >
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid || Boolean(fieldError) || undefined}>
                  <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                  <PasswordField
                    autoComplete="new-password"
                    id={field.name}
                    invalid={isInvalid || Boolean(fieldError) || undefined}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onValueChange={field.handleChange}
                    showStrength
                    value={field.state.value}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  {fieldError && <FieldError>{fieldError}</FieldError>}
                </Field>
              )
            }}
          </form.Field>
        </FieldGroup>

        {formError && <FieldError>{formError}</FieldError>}

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button
              className="w-full"
              disabled={isSubmitting}
              size="xl"
              type="submit"
              variant="button-mauve"
            >
              Save password and log in
            </Button>
          )}
        </form.Subscribe>
      </form>
    </ResetLayout>
  )
}
