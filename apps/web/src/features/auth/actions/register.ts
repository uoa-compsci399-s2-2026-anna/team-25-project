"use server"

import {
  ALLOWED_AVATAR_MIME_TYPES,
  type RegisterDetails,
  type RegisterWithCode,
  registerDetailsSchema,
  registerProfileSchema,
  registerWithCodeSchema,
} from "@repo/shared/schemas/register"
import { refresh } from "next/cache"
import { type Payload, ValidationError } from "payload"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { isRecognisedEmail } from "../helpers/recognisedEmail"
import { setSessionCookie } from "../helpers/sessionCookie"
import {
  type CheckCodeResult,
  checkCode,
  consumeCode,
  issueCode,
} from "../helpers/verificationCode"
import type { ActionResult, SendCodeResult } from "./types"

type ZodIssue = { message: string; path: PropertyKey[] }

const fieldErrorsFromIssues = (issues: readonly ZodIssue[]): Record<string, string> => {
  const fieldErrors: Record<string, string> = {}
  for (const issue of issues) {
    const field = issue.path[0]
    // Only the first message per field is shown, matching one message per input.
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }
  return fieldErrors
}

/**
 * Payload reports its own failures - a duplicate email, or the institution
 * domain check in `enforceInstitutionDomain` - as a ValidationError carrying
 * field paths, so they can be shown against the offending input rather than as
 * one opaque banner.
 */
const fieldErrorsFromPayload = (error: ValidationError): Record<string, string> => {
  const fieldErrors: Record<string, string> = {}
  for (const { path, message } of error.data?.errors ?? []) {
    if (path && !fieldErrors[path]) {
      fieldErrors[path] = message
    }
  }
  return fieldErrors
}

// A path-less or empty errors list produces {} - fall back to a form-level
// message rather than silently returning nothing to show.
const resultFromValidationError = (
  error: ValidationError,
  fallbackFormError: string,
): ActionResult => {
  const fieldErrors = fieldErrorsFromPayload(error)
  return Object.keys(fieldErrors).length > 0
    ? { fieldErrors, ok: false }
    : { formError: fallbackFormError, ok: false }
}

/**
 * Signs the new member in straight after creating them. The email was proven
 * with a code before the account existed, so the account is usable immediately
 * and the profile step runs authenticated.
 */
const signIn = async (email: string, password: string) => {
  const payload = await getPayloadClient()

  const { token } = await payload.login({
    collection: Slugs.Collections.MEMBERS,
    data: { email, password },
  })

  // registerMember's catch turns this into "signing you in failed" - silently
  // returning here instead would report { ok: true } with no cookie set.
  if (!token) throw new Error("Payload login returned no token")

  await setSessionCookie(payload, token)
}

const parseInstitutionId = (institution: string) => {
  const institutionId = Number(institution)
  return Number.isInteger(institutionId) ? institutionId : null
}

/**
 * The checks `payload.create` would fail on, run before a code is sent so nobody
 * proves an address only to have the account refused. The messages match the
 * ones Payload and `enforceInstitutionDomain` give, which still decide on create.
 */
const registrationBlockers = async (
  payload: Payload,
  email: string,
  institutionId: number,
): Promise<Record<string, string> | null> => {
  const institution = await payload.findByID({
    collection: Slugs.Collections.INSTITUTIONS,
    id: institutionId,
    depth: 0,
    disableErrors: true,
  })
  if (!institution) return { institution: "Selected institution does not exist." }

  const domains = institution.domains.map(({ domain }) => domain)
  if (!isRecognisedEmail(email, domains)) {
    return {
      email: `Email domain does not match a registered domain for ${institution.name}.`,
    }
  }

  const { totalDocs } = await payload.count({
    collection: Slugs.Collections.MEMBERS,
    where: { email: { equals: email.trim().toLowerCase() } },
  })
  if (totalDocs > 0) return { email: "A user with the given email is already registered." }

  return null
}

const formatWait = (seconds: number) =>
  seconds < 60
    ? `${seconds} second${seconds === 1 ? "" : "s"}`
    : `${Math.ceil(seconds / 60)} minute${Math.ceil(seconds / 60) === 1 ? "" : "s"}`

/**
 * Step one's first submit: checks the details, then emails a code to prove the
 * address. No account exists until `registerMember` receives that code.
 */
export const sendVerificationCode = async (input: RegisterDetails): Promise<SendCodeResult> => {
  const parsed = registerDetailsSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const institutionId = parseInstitutionId(parsed.data.institution)
  if (institutionId === null) {
    return { fieldErrors: { institution: "Select your university or institution" }, ok: false }
  }

  const payload = await getPayloadClient()

  // Without SES, Payload logs each email instead of sending it, and the subject
  // carries the code. Fine locally; in production nobody would get a code and
  // every code would sit in the server logs.
  if (process.env.NODE_ENV === "production" && payload.email.name === "console") {
    payload.logger.error("sendVerificationCode: no email adapter is configured")
    return { formError: "We couldn't send your code. Try again later.", ok: false }
  }

  try {
    const blockers = await registrationBlockers(payload, parsed.data.email, institutionId)
    if (blockers) return { fieldErrors: blockers, ok: false }

    const issued = await issueCode(parsed.data.email)
    if (issued.ok) return { ok: true }
    if (issued.error === "cooldown") {
      return {
        formError: `You can ask for a new code in ${formatWait(issued.retryAfterSeconds)}.`,
        ok: false,
        retryAfterSeconds: issued.retryAfterSeconds,
      }
    }
    return { formError: "We couldn't send your code. Try again.", ok: false }
  } catch (error) {
    payload.logger.error({ err: error }, "sendVerificationCode failed")
    return { formError: "We couldn't send your code. Try again.", ok: false }
  }
}

const CODE_ERRORS: Record<Exclude<CheckCodeResult, "ok">, string> = {
  expired: "This code has expired. Send a new one.",
  invalid: "That code isn't right. Check the email and try again.",
  locked: "Too many incorrect tries. Send a new code.",
}

/**
 * Step one's final submit: creates the account once the emailed code checks
 * out, then signs the member in for the profile step.
 */
export const registerMember = async (input: RegisterWithCode): Promise<ActionResult> => {
  // Re-validated here rather than trusting the client's own pass. Everything is
  // checked before the code, since every code check uses up one of its tries.
  const parsed = registerWithCodeSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const { code, email, firstName, institution, lastName, password, position, title } = parsed.data
  const institutionId = parseInstitutionId(institution)
  if (institutionId === null) {
    return { fieldErrors: { institution: "Select your university or institution" }, ok: false }
  }

  const payload = await getPayloadClient()

  try {
    const result = await checkCode(email, code)
    if (result !== "ok") return { fieldErrors: { code: CODE_ERRORS[result] }, ok: false }
  } catch (error) {
    payload.logger.error({ err: error }, "checking a verification code failed")
    return { formError: "We couldn't check your code. Try again.", ok: false }
  }

  try {
    await payload.create({
      collection: Slugs.Collections.MEMBERS,
      data: { email, firstName, institution: institutionId, lastName, password, position, title },
      overrideAccess: false,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return resultFromValidationError(error, "Could not create your account. Try again.")
    }
    return { formError: "Could not create your account. Try again.", ok: false }
  }

  // The account exists now, so a leftover code only means one stale row - it
  // expires on its own and must not fail the sign-up.
  await consumeCode(email).catch((error) =>
    payload.logger.error({ err: error }, "consuming a verification code failed"),
  )

  try {
    await signIn(email, password)
  } catch {
    // The account exists, so failing to sign in is recoverable by logging in -
    // say so rather than implying the registration itself failed.
    return { formError: "Account created, but signing you in failed. Try logging in.", ok: false }
  }

  return { ok: true }
}

// Links are an array of objects, which FormData can't carry natively. Malformed
// JSON becomes null so the schema rejects it rather than the action throwing.
const parseLinks = (value: FormDataEntryValue | null): unknown => {
  try {
    return JSON.parse((value as string | null) ?? "[]")
  } catch {
    return null
  }
}

export const completeProfile = async (formData: FormData): Promise<ActionResult> => {
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) {
    return { formError: "Sign in to finish setting up your profile.", ok: false }
  }

  const parsed = registerProfileSchema.safeParse({
    bio: (formData.get("bio") as string | null) ?? "",
    department: (formData.get("department") as string | null) ?? "",
    faculty: (formData.get("faculty") as string | null) ?? "",
    links: parseLinks(formData.get("links")),
    researchInterests: (formData.get("researchInterests") as string | null) ?? "",
    teachingInterests: (formData.get("teachingInterests") as string | null) ?? "",
  })
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const payload = await getPayloadClient()
  const avatar = formData.get("avatar")
  let avatarId: number | undefined

  if (avatar instanceof File && avatar.size > 0) {
    if (!ALLOWED_AVATAR_MIME_TYPES.includes(avatar.type)) {
      return { formError: "Please upload a JPG, PNG, GIF or WEBP image.", ok: false }
    }

    try {
      const media = await payload.create({
        collection: Slugs.Collections.MEDIA,
        data: { alt: `${user.firstName} ${user.lastName}` },
        file: {
          data: Buffer.from(await avatar.arrayBuffer()),
          mimetype: avatar.type,
          name: avatar.name,
          size: avatar.size,
        },
        overrideAccess: false,
        user,
      })
      avatarId = media.id
    } catch (error) {
      // Errors here are about the file, not a Member field - never route
      // through fieldErrorsFromPayload.
      payload.logger.error({ err: error }, "avatar upload failed")
      return { formError: "Could not upload your photo. Try again.", ok: false }
    }
  }

  try {
    await payload.update({
      collection: Slugs.Collections.MEMBERS,
      context: { completingRegistration: true },
      data: {
        avatar: avatarId,
        bio: parsed.data.bio,
        department: parsed.data.department,
        faculty: parsed.data.faculty,
        links: parsed.data.links,
        researchInterests: parsed.data.researchInterests,
        teachingInterests: parsed.data.teachingInterests,
        registrationCompletedAt: new Date().toISOString(),
      },
      id: user.id,
      overrideAccess: false,
      user,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return resultFromValidationError(error, "Could not save your profile. Try again.")
    }
    // Anything else is a real failure rather than bad input, so surface it in
    // the server log instead of only showing the user a generic message.
    payload.logger.error({ err: error }, "completeProfile failed")
    return { formError: "Could not save your profile. Try again.", ok: false }
  }

  refresh()

  return { ok: true }
}
