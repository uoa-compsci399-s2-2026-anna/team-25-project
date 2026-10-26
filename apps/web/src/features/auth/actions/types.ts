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

/**
 * Sending an email (a sign-up code or a reset link) can be refused for a while;
 * the form counts this down before offering a resend.
 */
export type SendCodeResult =
  | ActionResult
  | ({ ok: false; retryAfterSeconds: number } & FormError & Partial<FieldErrors>)

/** An expired, used or mangled reset link; the form swaps to "request a new link" instead of retrying. */
export type ResetPasswordResult = ActionResult | ({ ok: false; invalidToken: true } & FormError)
