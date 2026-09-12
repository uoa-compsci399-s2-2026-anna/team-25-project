/**
 * Kept out of the "use server" module: that file may only export async
 * functions, so the shared result shape lives here.
 */

/** Shown above the submit button when the failure isn't tied to one field. */
type FormError = { formError: string }

/** Keyed by form field name, so the form can attach each message to its input. */
type FieldErrors = { fieldErrors: Record<string, string> }

// At least one of formError/fieldErrors is required
export type ActionResult =
  | { ok: true }
  | ({ ok: false } & FormError & Partial<FieldErrors>)
  | ({ ok: false } & Partial<FormError> & FieldErrors)
