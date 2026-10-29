"use client"

import {
  forgotPasswordSchema,
  RESET_EMAIL_RESEND_SECONDS,
} from "@repo/shared/schemas/passwordReset"
import { validateField } from "@repo/shared/utils/validate-field"
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Heading,
  Input,
} from "@repo/ui/components/ui"
import { useForm } from "@tanstack/react-form"
import { parseAsString, useQueryState } from "nuqs"
import { type ReactNode, useEffect, useState } from "react"
import { requestPasswordReset } from "../actions/requestPasswordReset"

// The hourly send cap can mean a wait of most of an hour, which reads better as 45:00 than 2700s.
const formatWait = (seconds: number) =>
  seconds <= 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

/** Both steps share one frame, each with its own heading, so the swap doesn't shift the page. */
const ForgotLayout = ({
  title,
  description,
  children,
}: {
  title: string
  description: ReactNode
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

type Sent = { email: string; waitSeconds: number; formError?: string }

export const ForgotPasswordForm = () => {
  // Filled in when arriving from login or a profile, so the email needn't be typed twice.
  const [email] = useQueryState("email", parseAsString.withDefault(""))
  // Next keeps this page alive between visits rather than remounting it, so a
  // form opened earlier would ignore a new ?email=. Keyed on it to start afresh.
  return <ForgotPasswordSteps initialEmail={email} key={email} />
}

const ForgotPasswordSteps = ({ initialEmail }: { initialEmail: string }) => {
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [emailError, setEmailError] = useState<string | undefined>(undefined)
  const [sent, setSent] = useState<Sent | null>(null)

  const form = useForm({
    defaultValues: { email: initialEmail },
    onSubmit: async ({ value }) => {
      setFormError(undefined)
      setEmailError(undefined)

      try {
        const result = await requestPasswordReset(value)

        if (result.ok) {
          setSent({ email: value.email, waitSeconds: RESET_EMAIL_RESEND_SECONDS })
          return
        }

        // An email went to this address moments ago - wait on that one rather
        // than asking for the address again.
        if ("retryAfterSeconds" in result) {
          setSent({
            email: value.email,
            formError: result.formError,
            waitSeconds: result.retryAfterSeconds,
          })
          return
        }

        setEmailError(result.fieldErrors?.email)
        setFormError(result.formError)
      } catch {
        setFormError("We couldn't send the email right now. Try again.")
      }
    },
    validators: { onSubmit: forgotPasswordSchema },
  })

  if (sent) {
    return <SentStep {...sent} onBack={() => setSent(null)} />
  }

  return (
    <ForgotLayout
      description="Enter your email and we'll send you a link to set a new one."
      title="Reset your password"
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
            name="email"
            validators={{ onBlur: validateField(forgotPasswordSchema.shape.email) }}
          >
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid || Boolean(emailError) || undefined}>
                  <FieldLabel htmlFor={field.name}>University email</FieldLabel>
                  <Input
                    aria-invalid={isInvalid || Boolean(emailError) || undefined}
                    autoComplete="email"
                    className="h-10"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    type="email"
                    value={field.state.value}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  {emailError && <FieldError>{emailError}</FieldError>}
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
              {isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </ForgotLayout>
  )
}

/**
 * Worded the same whether or not the address has an account, so the page
 * can't be used to check who's a member.
 */
const SentStep = ({
  email,
  formError: initialFormError,
  waitSeconds: initialWaitSeconds,
  onBack,
}: Sent & { onBack: () => void }) => {
  const [formError, setFormError] = useState(initialFormError)
  const [notice, setNotice] = useState<string | undefined>(undefined)
  const [waitSeconds, setWaitSeconds] = useState(initialWaitSeconds)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (waitSeconds <= 0) return
    const timer = setTimeout(() => setWaitSeconds((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [waitSeconds])

  const resend = async () => {
    setResending(true)
    setFormError(undefined)
    setNotice(undefined)

    try {
      const result = await requestPasswordReset({ email })
      if (result.ok) {
        setWaitSeconds(RESET_EMAIL_RESEND_SECONDS)
        setNotice("Sent again. Only the newest link will work.")
        return
      }
      if ("retryAfterSeconds" in result) setWaitSeconds(result.retryAfterSeconds)
      setFormError(result.formError ?? "We couldn't send the email right now. Try again.")
    } catch {
      setFormError("We couldn't send the email right now. Try again.")
    } finally {
      setResending(false)
    }
  }

  return (
    <ForgotLayout
      description={
        <>
          If there's an account for <span className="font-medium text-foreground">{email}</span>,
          we've sent it a link to set a new password. The link works once, for an hour.
        </>
      }
      title="Check your inbox"
    >
      <div className="flex flex-col gap-3">
        {formError && <FieldError>{formError}</FieldError>}

        <Button
          className="w-full"
          disabled={waitSeconds > 0 || resending}
          onClick={() => void resend()}
          size="xl"
          type="button"
          variant="button-mauve"
        >
          {resending
            ? "Sending..."
            : waitSeconds > 0
              ? `Resend email in ${formatWait(waitSeconds)}`
              : "Resend email"}
        </Button>

        <button
          className="cursor-pointer text-muted-foreground text-sm underline underline-offset-4 hover:text-foreground"
          onClick={onBack}
          type="button"
        >
          Use a different email
        </button>

        {/* Always mounted: screen readers more reliably announce text that changes inside an
            existing live region than a region that appears with its text. */}
        <p className="text-center text-muted-foreground text-sm" role="status">
          {notice}
        </p>
      </div>
    </ForgotLayout>
  )
}
