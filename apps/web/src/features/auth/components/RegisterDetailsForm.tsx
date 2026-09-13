"use client"

import { registerDetailsSchema } from "@repo/shared/schemas/register"
import {
  Button,
  Checkbox,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@repo/ui/components/ui"
import { useForm } from "@tanstack/react-form"
import { Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Routes } from "@/lib/routes"
import { registerMember } from "../actions/register"
import { isRecognisedEmail } from "../helpers/recognisedEmail"
import { type InstitutionOption, InstitutionSelect } from "./InstitutionSelect"
import { PasswordField } from "./PasswordField"

const RequiredMark = () => (
  <span aria-hidden="true" className="text-destructive">
    *
  </span>
)

export const RegisterDetailsForm = ({ institutions }: { institutions: InstitutionOption[] }) => {
  const router = useRouter()
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const form = useForm({
    defaultValues: {
      agreedToTerms: false,
      email: "",
      firstName: "",
      institution: "",
      lastName: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setFieldErrors({})
      setFormError(undefined)

      try {
        const result = await registerMember(value)

        if (result.ok) {
          router.push(Routes.REGISTER.PROFILE)
          return
        }

        setFieldErrors(result.fieldErrors ?? {})
        setFormError(result.formError)
      } catch {
        setFormError("Could not create your account. Try again.")
      }
    },
    validators: { onSubmit: registerDetailsSchema },
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
      <FieldGroup>
        <div className="grid gap-6 sm:grid-cols-2">
          <form.Field name="firstName">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                <FieldLabel htmlFor={field.name}>
                  First name <RequiredMark />
                </FieldLabel>
                <Input
                  autoComplete="given-name"
                  className="h-10"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  value={field.state.value}
                />
                <FieldError errors={field.state.meta.errors} />
                {fieldErrors.firstName && <FieldError>{fieldErrors.firstName}</FieldError>}
              </Field>
            )}
          </form.Field>

          <form.Field name="lastName">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                <FieldLabel htmlFor={field.name}>
                  Surname <RequiredMark />
                </FieldLabel>
                <Input
                  autoComplete="family-name"
                  className="h-10"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  value={field.state.value}
                />
                <FieldError errors={field.state.meta.errors} />
                {fieldErrors.lastName && <FieldError>{fieldErrors.lastName}</FieldError>}
              </Field>
            )}
          </form.Field>
        </div>

        <form.Field name="institution">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
              <FieldLabel htmlFor={field.name}>
                University / Institution <RequiredMark />
              </FieldLabel>
              <InstitutionSelect
                id={field.name}
                institutions={institutions}
                invalid={field.state.meta.errors.length > 0 || undefined}
                name={field.name}
                onValueChange={field.handleChange}
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors} />
              {fieldErrors.institution && <FieldError>{fieldErrors.institution}</FieldError>}
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.values.institution}>
          {(institutionId) => (
            <form.Field name="email">
              {(field) => {
                const domains =
                  institutions.find((institution) => String(institution.id) === institutionId)
                    ?.domains ?? []
                const recognised = isRecognisedEmail(field.state.value, domains)

                return (
                  <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                    <FieldLabel htmlFor={field.name}>
                      University email <RequiredMark />
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        autoComplete="email"
                        className="h-10 pr-10"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        type="email"
                        value={field.state.value}
                      />
                      {recognised && (
                        <Check
                          aria-label="Recognised institution email"
                          className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-brand-teal"
                          role="img"
                        />
                      )}
                    </div>
                    <FieldError errors={field.state.meta.errors} />
                    {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
                  </Field>
                )
              }}
            </form.Field>
          )}
        </form.Subscribe>

        <form.Field name="password">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
              <FieldLabel htmlFor={field.name}>
                Password <RequiredMark />
              </FieldLabel>
              <PasswordField
                autoComplete="new-password"
                id={field.name}
                invalid={field.state.meta.errors.length > 0 || undefined}
                name={field.name}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
                showStrength
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors} />
              {fieldErrors.password && <FieldError>{fieldErrors.password}</FieldError>}
            </Field>
          )}
        </form.Field>

        <form.Field name="agreedToTerms">
          {(field) => (
            <Field
              data-invalid={field.state.meta.errors.length > 0 || undefined}
              orientation="horizontal"
            >
              <Checkbox
                checked={field.state.value}
                id={field.name}
                name={field.name}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
              <FieldLabel className="font-normal" htmlFor={field.name}>
                I agree to the{" "}
                <Link className="text-primary underline underline-offset-4" href={Routes.ABOUT}>
                  community guidelines
                </Link>{" "}
                and{" "}
                <Link className="text-primary underline underline-offset-4" href={Routes.PRIVACY}>
                  privacy policy
                </Link>
                .
              </FieldLabel>
            </Field>
          )}
        </form.Field>

        <form.Field name="agreedToTerms">
          {(field) => <FieldError errors={field.state.meta.errors} />}
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
            {isSubmitting ? "Creating your account..." : "Register & continue"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
