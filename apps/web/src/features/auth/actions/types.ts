/**
 * Kept out of the "use server" module: that file may only export async
 * functions, so the shared result shape lives here.
 */
export type ActionResult =
  | { ok: true }
  | {
      ok: false
      /** Shown above the submit button when the failure isn't tied to one field. */
      formError?: string
      /** Keyed by form field name, so the form can attach each message to its input. */
      fieldErrors?: Record<string, string>
    }
