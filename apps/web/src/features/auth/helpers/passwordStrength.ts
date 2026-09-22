import { PASSWORD_MIN_LENGTH } from "@repo/shared/schemas/register"

/** Segments drawn in the strength meter, so the bar and the score can't drift. */
export const PASSWORD_STRENGTH_STEPS = 4

export type PasswordStrength = {
  /** 0 when the password is too short to score, otherwise 1-4. */
  score: number
  label: string
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"]

const LONG_PASSWORD_LENGTH = 12

/**
 * Deliberately simple and local: enough to tell someone their password is thin
 * without shipping a dictionary. Anything below the schema's minimum scores 0,
 * so the meter never tells someone a rejected password is fine.
 */
export const passwordStrength = (password: string): PasswordStrength => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { label: LABELS[0] as string, score: 0 }
  }

  const bonuses = [
    /\p{Ll}/u.test(password) && /\p{Lu}/u.test(password),
    /\d/.test(password),
    /[^\p{L}\d]/u.test(password),
    password.length >= LONG_PASSWORD_LENGTH,
  ].filter(Boolean).length

  const score = Math.min(1 + bonuses, PASSWORD_STRENGTH_STEPS)

  return { label: LABELS[score] as string, score }
}
