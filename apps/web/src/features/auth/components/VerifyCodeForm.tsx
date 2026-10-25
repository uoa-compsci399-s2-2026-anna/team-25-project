"use client"

import {
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_RESEND_SECONDS,
  VERIFICATION_CODE_TTL_MINUTES,
  verificationCodeSchema,
} from "@repo/shared/schemas/register"
import { Button, Field, FieldError, FieldGroup, FieldLabel, Input } from "@repo/ui/components/ui"
import { useForm } from "@tanstack/react-form"
import { useEffect, useState } from "react"
import { z } from "zod"
import type { ActionResult, SendCodeResult } from "../actions/types"

const codeFormSchema = z.object({ code: verificationCodeSchema })

// The hourly send cap can mean a wait of most of an hour, which reads better as 45:00 than 2700s.
const formatWait = (seconds: number) =>
  seconds <= 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

type VerifyCodeFormProps = {
  email: string
  /** Shown on arrival, e.g. why a resend has to wait. */
  initialFormError?: string
  /** Seconds before the first resend is allowed, e.g. when a code was sent moments ago. */
  initialWaitSeconds?: number
  onBack: () => void
  onResend: () => Promise<SendCodeResult>
  onVerify: (code: string) => Promise<ActionResult>
}

/**
 * Step one's second half: the details form has already sent a code, so this
 * only collects it. The parent owns the details and decides where success goes.
 */
export const VerifyCodeForm = ({
  email,
  initialFormError,
  initialWaitSeconds = VERIFICATION_CODE_RESEND_SECONDS,
  onBack,
  onResend,
  onVerify,
}: VerifyCodeFormProps) => {
  const [codeError, setCodeError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<string | undefined>(initialFormError)
  const [notice, setNotice] = useState<string | undefined>(undefined)
  const [waitSeconds, setWaitSeconds] = useState(initialWaitSeconds)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (waitSeconds <= 0) return
    const timer = setTimeout(() => setWaitSeconds((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [waitSeconds])

  const form = useForm({
    defaultValues: { code: "" },
    onSubmit: async ({ value }) => {
      setCodeError(undefined)
      setFormError(undefined)
      setNotice(undefined)

      try {
        const result = await onVerify(value.code.trim())
        if (result.ok) return
        setCodeError(result.fieldErrors?.code)
        setFormError(result.formError)
      } catch {
        setFormError("We couldn't check your code. Try again.")
      }
    },
    validators: { onSubmit: codeFormSchema },
  })

  const resend = async () => {
    setResending(true)
    setCodeError(undefined)
    setFormError(undefined)
    setNotice(undefined)

    try {
      const result = await onResend()
      if (result.ok) {
        form.reset()
        setWaitSeconds(VERIFICATION_CODE_RESEND_SECONDS)
        setNotice(`We sent a new code to ${email}.`)
        return
      }
      if ("retryAfterSeconds" in result) setWaitSeconds(result.retryAfterSeconds)
      setFormError(result.formError ?? "We couldn't send a new code. Try again.")
    } catch {
      setFormError("We couldn't send a new code. Try again.")
    } finally {
      setResending(false)
    }
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
      <p className="text-center text-muted-foreground">
        We sent a {VERIFICATION_CODE_LENGTH}-digit code to{" "}
        <span className="font-medium text-foreground">{email}</span>. It expires in{" "}
        {VERIFICATION_CODE_TTL_MINUTES} minutes.
      </p>

      <FieldGroup>
        <form.Field name="code">
          {(field) => (
            <Field
              data-invalid={field.state.meta.errors.length > 0 || Boolean(codeError) || undefined}
            >
              <FieldLabel htmlFor={field.name}>Verification code</FieldLabel>
              <Input
                autoComplete="one-time-code"
                autoFocus
                className="h-12 text-center font-mono text-xl tracking-[0.4em]"
                id={field.name}
                inputMode="numeric"
                name={field.name}
                onBlur={field.handleBlur}
                // Capped here rather than with maxLength, which browsers apply to a paste
                // before this runs - " 482 913" would lose a digit to the spaces.
                onChange={(event) =>
                  field.handleChange(
                    event.target.value.replace(/\D/g, "").slice(0, VERIFICATION_CODE_LENGTH),
                  )
                }
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors} />
              {codeError && <FieldError>{codeError}</FieldError>}
            </Field>
          )}
        </form.Field>
      </FieldGroup>

      {formError && <FieldError>{formError}</FieldError>}

      <div className="flex flex-col gap-3">
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button
              className="w-full"
              disabled={isSubmitting}
              size="xl"
              type="submit"
              variant="button-mauve"
            >
              {isSubmitting ? "Creating your account..." : "Verify & continue"}
            </Button>
          )}
        </form.Subscribe>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            className="cursor-pointer text-muted-foreground underline underline-offset-4 hover:text-foreground"
            onClick={onBack}
            type="button"
          >
            Change your details
          </button>
          <button
            className="cursor-pointer text-primary underline underline-offset-4 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
            disabled={waitSeconds > 0 || resending}
            onClick={() => void resend()}
            type="button"
          >
            {resending
              ? "Sending..."
              : waitSeconds > 0
                ? `Resend code in ${formatWait(waitSeconds)}`
                : "Resend code"}
          </button>
        </div>

        {/* Always mounted: screen readers more reliably announce text that changes inside an
            existing live region than a region that appears with its text. */}
        <p className="text-center text-muted-foreground text-sm" role="status">
          {notice}
        </p>
      </div>
    </form>
  )
}
