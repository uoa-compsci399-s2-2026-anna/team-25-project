"use server"

import {
  type RegisterDetails,
  registerDetailsSchema,
  registerProfileSchema,
} from "@repo/shared/schemas/register"
import { cookies } from "next/headers"
import { ValidationError } from "payload"
import { generatePayloadCookie } from "payload/shared"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import type { ActionResult } from "./types"

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

/**
 * Signs the new member in straight after creating them. Email verification is
 * not set up yet, so there is no intermediate "check your inbox" state - the
 * account is usable immediately and the profile step runs authenticated.
 */
const signIn = async (email: string, password: string) => {
  const payload = await getPayloadClient()

  const { token } = await payload.login({
    collection: Slugs.Collections.MEMBERS,
    data: { email, password },
  })

  if (!token) return

  const cookie = generatePayloadCookie({
    collectionAuthConfig: payload.collections[Slugs.Collections.MEMBERS].config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    returnCookieAsObject: true,
    token,
  })

  const cookieStore = await cookies()
  cookieStore.set(cookie.name, cookie.value ?? "", {
    domain: cookie.domain,
    expires: cookie.expires ? new Date(cookie.expires) : undefined,
    httpOnly: cookie.httpOnly,
    maxAge: cookie.maxAge,
    path: cookie.path,
    // Payload capitalises these; Next's cookie API expects them lowercased.
    sameSite: cookie.sameSite?.toLowerCase() as "lax" | "none" | "strict" | undefined,
    secure: cookie.secure,
  })
}

export const registerMember = async (input: RegisterDetails): Promise<ActionResult> => {
  // Re-validated here rather than trusting the client's own pass.
  const parsed = registerDetailsSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const { email, firstName, institution, lastName, password } = parsed.data
  const institutionId = Number(institution)
  if (!Number.isInteger(institutionId)) {
    return { fieldErrors: { institution: "Select your university or institution" }, ok: false }
  }

  const payload = await getPayloadClient()

  try {
    await payload.create({
      collection: Slugs.Collections.MEMBERS,
      data: { email, firstName, institution: institutionId, lastName, password },
      overrideAccess: false,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return { fieldErrors: fieldErrorsFromPayload(error), ok: false }
    }
    return { formError: "Could not create your account. Try again.", ok: false }
  }

  try {
    await signIn(email, password)
  } catch {
    // The account exists, so failing to sign in is recoverable by logging in -
    // say so rather than implying the registration itself failed.
    return { formError: "Account created, but signing you in failed. Try logging in.", ok: false }
  }

  return { ok: true }
}

export const completeProfile = async (formData: FormData): Promise<ActionResult> => {
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) {
    return { formError: "Sign in to finish setting up your profile.", ok: false }
  }

  const parsed = registerProfileSchema.safeParse({
    bio: (formData.get("bio") as string | null) ?? "",
    position: (formData.get("position") as string | null) ?? "",
  })
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const payload = await getPayloadClient()
  const avatar = formData.get("avatar")
  let avatarId: number | undefined

  try {
    if (avatar instanceof File && avatar.size > 0) {
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
    }

    await payload.update({
      collection: Slugs.Collections.MEMBERS,
      data: {
        avatar: avatarId,
        bio: parsed.data.bio,
        position: parsed.data.position,
        registrationCompletedAt: new Date().toISOString(),
      },
      id: user.id,
      overrideAccess: false,
      user,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return { fieldErrors: fieldErrorsFromPayload(error), ok: false }
    }
    // Anything else is a real failure rather than bad input, so surface it in
    // the server log instead of only showing the user a generic message.
    payload.logger.error({ err: error }, "completeProfile failed")
    return { formError: "Could not save your profile. Try again.", ok: false }
  }

  return { ok: true }
}
