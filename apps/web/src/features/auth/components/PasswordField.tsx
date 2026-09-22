"use client"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { useState } from "react"
import { PASSWORD_STRENGTH_STEPS, passwordStrength } from "../helpers/passwordStrength"

const SEGMENTS = Array.from({ length: PASSWORD_STRENGTH_STEPS }, (_, index) => index + 1)

type PasswordFieldProps = {
  /** Explicit per call site: sign-up needs new-password, login needs current-password. */
  autoComplete: string
  id: string
  invalid?: boolean
  name: string
  onBlur: () => void
  onValueChange: (value: string) => void
  /** Opt in - scoring an existing password on login says nothing useful. */
  showStrength?: boolean
  value: string
}

export const PasswordField = ({
  autoComplete,
  id,
  invalid,
  name,
  onBlur,
  onValueChange,
  showStrength = false,
  value,
}: PasswordFieldProps) => {
  const [revealed, setRevealed] = useState(false)
  const { label, score } = passwordStrength(value)

  return (
    <div className="flex flex-col gap-2">
      <InputGroup className="h-10">
        <InputGroupInput
          aria-invalid={invalid}
          autoComplete={autoComplete}
          id={id}
          name={name}
          onBlur={onBlur}
          onChange={(event) => onValueChange(event.target.value)}
          type={revealed ? "text" : "password"}
          value={value}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            onClick={() => setRevealed((current) => !current)}
            type="button"
            variant="button-transparent"
          >
            {revealed ? "Hide" : "Show"}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      {showStrength && value.length > 0 && (
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="flex flex-1 gap-1.5">
            {SEGMENTS.map((segment) => (
              <span
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  segment <= score ? "bg-brand-rose" : "bg-border",
                )}
                key={segment}
              />
            ))}
          </div>
          {/* The meter is decorative; this text is what a screen reader gets. */}
          <span aria-live="polite" className="text-muted-foreground text-xs">
            {label}
          </span>
        </div>
      )}
    </div>
  )
}
