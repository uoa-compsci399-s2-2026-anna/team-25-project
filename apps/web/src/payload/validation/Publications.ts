import { DOI_PATTERN } from "@repo/shared/schemas/publications"
import type { TextFieldSingleValidation } from "payload"
import { text } from "payload/shared"

export const validateDoi: TextFieldSingleValidation = (value, options) => {
  const builtIn = text(value, options)
  if (builtIn !== true) return builtIn
  if (!value) return true

  return DOI_PATTERN.test(value) || "Enter a DOI that starts with 10."
}
