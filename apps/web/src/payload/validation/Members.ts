import { isHttpUrl } from "@repo/shared/utils/is-http-url"
import type { TextFieldSingleValidation } from "payload"
import { text } from "payload/shared"

/** Link URLs are rendered as hrefs on the member's profile. */
export const validateMemberLinkUrl: TextFieldSingleValidation = (value, options) => {
  const builtIn = text(value, options)
  if (builtIn !== true) return builtIn
  if (!value) return true

  return isHttpUrl(value) || "Enter a full web address starting with http:// or https://"
}
