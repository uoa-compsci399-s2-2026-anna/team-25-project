"use client"

import { type MemberTitle, MemberTitleLabels } from "@repo/shared/enums/members"
import { registerDetailsSchema } from "@repo/shared/schemas/register"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import {
  Button,
  Checkbox,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui"
import { useForm } from "@tanstack/react-form"
import { Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryState } from "nuqs"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Routes } from "@/lib/routes"
import { registerMember, sendVerificationCode } from "../actions/register"
import { isRecognisedEmail } from "../helpers/recognisedEmail"
import { parseAsRedirect, REDIRECT_PARAM, withRedirect } from "../redirect"
import { type InstitutionOption, InstitutionSelect } from "./InstitutionSelect"
import { PasswordField } from "./PasswordField"
import { VerifyCodeForm } from "./VerifyCodeForm"

const titleOptions = toSelectOptions(MemberTitleLabels)

const RequiredMark = () => (
  <span aria-hidden="true" className="text-destructive">
    *
  </span>
)

export const RegisterDetailsForm = ({ institutions }: { institutions: InstitutionOption[] }) => {
  const router = useRouter()
  const [redirect] = useQueryState(REDIRECT_PARAM, parseAsRedirect)
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  // The details stay in this form while the code is entered, so going back to
  // change them keeps everything already typed.
  const [step, setStep] = useState<"details" | "code">("details")
  const [codeSent, setCodeSent] = useState<{
    email: string
    message?: string
    waitSeconds?: number
  } | null>(null)

  // Going back unmounts the focused button, which would drop focus to the top of
  // the page. Put it on the field that needs fixing instead.
  const focusOnReturn = useRef(false)
  useEffect(() => {
    if (step !== "details" || !focusOnReturn.current) return
    focusOnReturn.current = false
    document.getElementById(Object.keys(fieldErrors)[0] ?? "email")?.focus()
  }, [step, fieldErrors])

  const backToDetails = (errors: Record<string, string> = {}) => {
    setFieldErrors(errors)
    setFormError(undefined)
    focusOnReturn.current = true
    setStep("details")
  }

  const form = useForm({
    defaultValues: {
      agreedToTerms: false,
      email: "",
      firstName: "",
      institution: "",
      lastName: "",
      password: "",
      position: "",
      title: null as MemberTitle | null,
    },
    onSubmit: async ({ value }) => {
      setFieldErrors({})
      setFormError(undefined)

      try {
        const result = await sendVerificationCode(value)

        if (result.ok) {
          setCodeSent({ email: value.email })
          setStep("code")
          return
        }

        // A code for this address went out recently - carry on with it rather than
        // making the member wait to be sent another. Not limited to codes sent from
        // this page, since a refresh forgets those but the code still works.
        if ("retryAfterSeconds" in result) {
          setCodeSent({
            email: value.email,
            message: result.formError,
            waitSeconds: result.retryAfterSeconds,
          })
          setStep("code")
          return
        }

        setFieldErrors(result.fieldErrors ?? {})
        setFormError(result.formError)
      } catch {
        setFormError("We couldn't send your code. Try again.")
      }
    },
    validators: { onSubmit: registerDetailsSchema },
  })

  // Next keeps this page alive (hidden) after navigating away, so without this a
  // later visit - even after logging out - lands back on the spent code step with
  // the previous details and password still filled in. Only after a successful
  // sign-up, so wandering off mid-flow still keeps what was typed.
  const registered = useRef(false)
  useLayoutEffect(() => {
    return () => {
      if (!registered.current) return
      registered.current = false
      form.reset()
      setCodeSent(null)
      setStep("details")
    }
  }, [form])

  const verify = async (code: string) => {
    const result = await registerMember({ ...form.state.values, code })

    if (result.ok) {
      registered.current = true
      router.push(withRedirect(Routes.REGISTER.PROFILE, redirect))
      return result
    }

    // Anything not about the code (e.g. the email was registered meanwhile)
    // belongs against the details, so take the member back to them.
    const { code: _code, ...detailErrors } = result.fieldErrors ?? {}
    if (Object.keys(detailErrors).length > 0) backToDetails(detailErrors)
    return result
  }

  const resend = async () => {
    const result = await sendVerificationCode(form.state.values)
    // A refusal about the details (e.g. the address was registered meanwhile)
    // can't be fixed from the code form, so show it where it can be.
    if (!result.ok && result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
      backToDetails(result.fieldErrors)
    }
    return result
  }

  if (step === "code" && codeSent) {
    return (
      <VerifyCodeForm
        email={codeSent.email}
        initialFormError={codeSent.message}
        initialWaitSeconds={codeSent.waitSeconds}
        onBack={() => backToDetails()}
        onResend={resend}
        onVerify={verify}
      />
    )
  }

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
        <form.Field name="title">
          {(field) => (
            <Field
              className="sm:max-w-40"
              data-invalid={field.state.meta.errors.length > 0 || undefined}
            >
              <FieldLabel htmlFor={field.name}>Title</FieldLabel>
              <Select
                name={field.name}
                onValueChange={(value) => field.handleChange(value as MemberTitle | null)}
                value={field.state.value}
              >
                <SelectTrigger className="h-10 w-full" id={field.name}>
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
              <FieldError errors={field.state.meta.errors} />
              {fieldErrors.title && <FieldError>{fieldErrors.title}</FieldError>}
            </Field>
          )}
        </form.Field>

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

        <form.Field name="position">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
              <FieldLabel htmlFor={field.name}>
                Position <RequiredMark />
              </FieldLabel>
              <Input
                autoComplete="organization-title"
                className="h-10"
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
              className="items-start"
              data-invalid={field.state.meta.errors.length > 0 || undefined}
              orientation="horizontal"
            >
              {/* Sits on the first line of the label, which can wrap on narrow screens. */}
              <Checkbox
                checked={field.state.value}
                className="mt-0.5"
                id={field.name}
                name={field.name}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
              {/* block, not the label's default flex, so the sentence and its links flow inline
                  as one run of text rather than as separate columns. */}
              <FieldLabel className="block font-normal" htmlFor={field.name}>
                I agree to the{" "}
                <Link
                  className="text-primary underline underline-offset-4"
                  href={Routes.GUIDELINES}
                >
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
            {isSubmitting ? "Sending your code..." : "Continue"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
