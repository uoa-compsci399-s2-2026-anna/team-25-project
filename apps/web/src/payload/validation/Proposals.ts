import type { NumberFieldSingleValidation, SelectFieldSingleValidation } from "payload"
import { number, select } from "payload/shared"

type Timeframe = {
  startYear?: number | null
  endYear?: number | null
}

/**
 * A custom validate replaces Payload's built-in one for the field, so each of
 * these runs the built-in first to keep required, min and max working.
 */

/** Keeps the timeframe pointing forwards. */
export const validateProposalEndYear: NumberFieldSingleValidation = (value, options) => {
  const builtIn = number(value, options)
  if (builtIn !== true) return builtIn

  const { startYear } = options.siblingData as Timeframe
  if (typeof value !== "number" || typeof startYear !== "number") return true
  return value >= startYear || "End year cannot be before the start year."
}

/** A period on its own says nothing without the year it falls in. */
export const validateProposalEndPeriod: SelectFieldSingleValidation = (value, options) => {
  const builtIn = select(value, options)
  if (builtIn !== true) return builtIn

  const { endYear } = options.siblingData as Timeframe
  if (!value || typeof endYear === "number") return true
  return "Set an end year before choosing an end period."
}
