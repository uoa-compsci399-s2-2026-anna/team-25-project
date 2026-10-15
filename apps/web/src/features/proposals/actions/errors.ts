import type { ValidationError } from "payload"
import type { ActionResult } from "@/features/auth/actions/types"

// Kept out of the "use server" action files: those may only export async functions.

type ZodIssue = { message: string; path: PropertyKey[] }

export const fieldErrorsFromIssues = (issues: readonly ZodIssue[]): Record<string, string> => {
  const fieldErrors: Record<string, string> = {}
  for (const issue of issues) {
    const field = issue.path.join(".")
    // Only the first message per field is shown, matching one message per input.
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }
  return fieldErrors
}

// A path-less or empty errors list produces {} - fall back to a form-level
// message rather than silently returning nothing to show.
export const resultFromValidationError = (
  error: ValidationError,
  fallbackFormError: string,
): ActionResult => {
  const fieldErrors: Record<string, string> = {}
  for (const { path, message } of error.data?.errors ?? []) {
    if (path && !fieldErrors[path]) {
      fieldErrors[path] = message
    }
  }
  return Object.keys(fieldErrors).length > 0
    ? { fieldErrors, ok: false }
    : { formError: fallbackFormError, ok: false }
}
