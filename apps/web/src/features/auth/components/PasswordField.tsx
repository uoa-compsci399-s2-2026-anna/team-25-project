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
  id: string
  invalid?: boolean
  name: string
  onBlur: () => void
  onValueChange: (value: string) => void
  value: string
}

export const PasswordField = ({
  id,
  invalid,
  name,
  onBlur,
  onValueChange,
  value,
}: PasswordFieldProps) => {
  const [revealed, setRevealed] = useState(false)
  const { label, score } = passwordStrength(value)

  return (
    <div className="flex flex-col gap-2">
      <InputGroup className="h-10">
        <InputGroupInput
          aria-invalid={invalid}
          autoComplete="new-password"
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

      {value.length > 0 && (
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
