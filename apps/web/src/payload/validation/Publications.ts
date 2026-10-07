import { DOI_ERROR, DOI_PATTERN, URL_ERROR, webUrlSchema } from "@repo/shared/schemas/publications"
import type { TextFieldSingleValidation } from "payload"
import { text } from "payload/shared"

export const validateDoi: TextFieldSingleValidation = (value, options) => {
  const builtIn = text(value, options)
  if (builtIn !== true) return builtIn
  if (!value) return true

  return DOI_PATTERN.test(value) || DOI_ERROR
}

export const validateUrl: TextFieldSingleValidation = (value, options) => {
  const builtIn = text(value, options)
  if (builtIn !== true) return builtIn
  if (!value) return true

  return webUrlSchema.safeParse(value).success || URL_ERROR
}
