import type { TextFieldSingleValidation } from "payload"
import { text } from "payload/shared"

/**
 * Link URLs are rendered as hrefs on the member's profile, so anything other
 * than http(s) - `javascript:` in particular - is rejected.
 */
export const validateMemberLinkUrl: TextFieldSingleValidation = (value, options) => {
  const builtIn = text(value, options)
  if (builtIn !== true) return builtIn
  if (!value) return true

  try {
    const { protocol } = new URL(value)
    if (protocol === "http:" || protocol === "https:") return true
  } catch {}
  return "Enter a full web address starting with http:// or https://"
}
