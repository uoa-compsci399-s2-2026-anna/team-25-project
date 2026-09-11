import { cookies } from "next/headers"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { completeProfile, registerMember } from "./register"

// A local stand-in so `instanceof` still discriminates: the action and this
// test both resolve to this same class. Declared via vi.hoisted because
// vi.mock's factory is hoisted above ordinary top-level declarations.
const { ValidationError } = vi.hoisted(() => {
  class ValidationError extends Error {
    data: { errors: { message: string; path: string }[] }
    constructor(errors: { message: string; path: string }[]) {
      super("Validation failed")
      this.data = { errors }
    }
  }
  return { ValidationError }
})

vi.mock("payload", () => ({ ValidationError }))
vi.mock("payload/shared", () => ({
  generatePayloadCookie: () => ({
    httpOnly: true,
    name: "payload-token",
    path: "/",
    sameSite: "Lax",
    secure: false,
    value: "signed-token",
  }),
}))
vi.mock("next/headers", () => ({ cookies: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const validDetails = {
  agreedToTerms: true,
  email: "a.tui@example.ac.nz",
  firstName: "Anna",
  institution: "1",
  lastName: "Tui",
  password: "Password1!",
}

const setCookie = vi.fn()

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    collections: { members: { config: { auth: {} } } },
    config: { cookiePrefix: "payload" },
    create: vi.fn().mockResolvedValue({ id: 1 }),
    login: vi.fn().mockResolvedValue({ token: "signed-token" }),
    update: vi.fn().mockResolvedValue({ id: 1 }),
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the actions call
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("registerMember", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockResolvedValue({ set: setCookie } as never)
  })

  it("rejects invalid input without touching Payload", async () => {
    const payload = mockPayload()

    const result = await registerMember({ ...validDetails, firstName: "" })

    expect(result).toEqual({ fieldErrors: { firstName: "First name is required" }, ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("requires the community guidelines to be accepted", async () => {
    mockPayload()

    const result = await registerMember({ ...validDetails, agreedToTerms: false })

    expect(result.ok).toBe(false)
    expect(result).toHaveProperty("fieldErrors.agreedToTerms")
  })

  it("creates the member, signs them in and sets the auth cookie", async () => {
    const payload = mockPayload()

    const result = await registerMember(validDetails)

    expect(result).toEqual({ ok: true })
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "members",
        // The institution reaches Payload as a number, not the form's string.
        data: expect.objectContaining({ email: validDetails.email, institution: 1 }),
      }),
    )
    expect(payload.login).toHaveBeenCalled()
    expect(setCookie).toHaveBeenCalledWith("payload-token", "signed-token", expect.anything())
  })

  it("surfaces a Payload validation error against the field it names", async () => {
    mockPayload({
      create: vi
        .fn()
        .mockRejectedValue(
          new ValidationError([
            { message: "Email domain does not match a registered domain.", path: "email" },
          ]),
        ),
    })

    const result = await registerMember(validDetails)

    expect(result).toEqual({
      fieldErrors: { email: "Email domain does not match a registered domain." },
      ok: false,
    })
  })

  it("reports a generic failure when Payload throws something else", async () => {
    mockPayload({ create: vi.fn().mockRejectedValue(new Error("connection lost")) })

    const result = await registerMember(validDetails)

    expect(result).toEqual({ formError: "Could not create your account. Try again.", ok: false })
  })

  it("says the account exists when sign-in fails after creation", async () => {
    mockPayload({ login: vi.fn().mockRejectedValue(new Error("nope")) })

    const result = await registerMember(validDetails)

    expect(result).toEqual({
      formError: "Account created, but signing you in failed. Try logging in.",
      ok: false,
    })
  })
})

describe("completeProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("refuses when nobody is signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })

    const result = await completeProfile(new FormData())

    expect(result).toEqual({
      formError: "Sign in to finish setting up your profile.",
      ok: false,
    })
  })

  it("updates the signed-in member's own record", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
      user: { firstName: "Anna", id: 7, lastName: "Tui" } as any,
    })
    const payload = mockPayload()

    const formData = new FormData()
    formData.set("position", "  Senior Lecturer  ")
    formData.set("bio", "Teaches capstone.")

    const result = await completeProfile(formData)

    expect(result).toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "members",
        data: expect.objectContaining({ bio: "Teaches capstone.", position: "Senior Lecturer" }),
        id: 7,
        // Access control must still apply - a member may only update themselves.
        overrideAccess: false,
      }),
    )
  })
})
