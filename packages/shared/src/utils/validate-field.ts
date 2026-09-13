import type { z } from "zod"

/**
 * Builds a per-field form validator from the schema the field belongs to, so
 * a field shows its own error on blur or change instead of waiting for submit.
 *
 * Empty fields pass, which leaves "required" messages to the form-level
 * validator on submit.
 */
export const validateField =
  <T>(schema: z.ZodType<T>) =>
  ({ value }: { value: T }) => {
    if (value === "" || value === undefined || value === null) return undefined

    const result = schema.safeParse(value)
    return result.success ? undefined : { message: result.error.issues[0]?.message }
  }
