import type { TextFieldSingleValidation } from "payload"
import { text } from "payload/shared"

const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/

export const validateDoi: TextFieldSingleValidation = (value, options) => {
  const builtIn = text(value, options)
  if (builtIn !== true) return builtIn
  if (!value) return true

  return DOI_PATTERN.test(value) || "Enter a DOI that starts with 10."
}
