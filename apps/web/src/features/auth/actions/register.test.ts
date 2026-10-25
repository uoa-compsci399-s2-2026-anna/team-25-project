import { refresh } from "next/cache"
import { cookies } from "next/headers"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { checkCode, consumeCode, issueCode } from "../helpers/verificationCode"
import { completeProfile, registerMember, sendVerificationCode } from "./register"

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
vi.mock("next/cache", () => ({ refresh: vi.fn() }))
vi.mock("next/headers", () => ({ cookies: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("../helpers/verificationCode", () => ({
  checkCode: vi.fn(),
  consumeCode: vi.fn(),
  issueCode: vi.fn(),
}))

const validDetails = {
  agreedToTerms: true,
  email: "a.tui@example.ac.nz",
  firstName: "Anna",
  institution: "1",
  lastName: "Tui",
  password: "Password1!",
  position: "Senior Lecturer",
  title: null,
}

const validRegistration = { ...validDetails, code: "482913" }

const setCookie = vi.fn()

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    collections: { members: { config: { auth: {} } } },
    config: { cookiePrefix: "payload" },
    count: vi.fn().mockResolvedValue({ totalDocs: 0 }),
    create: vi.fn().mockResolvedValue({ id: 1 }),
    email: { name: "nodemailer" },
    findByID: vi.fn().mockResolvedValue({
      domains: [{ domain: "example.ac.nz" }],
      id: 1,
      name: "Example University",
    }),
    logger: { error: vi.fn() },
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
    vi.mocked(checkCode).mockResolvedValue("ok")
    vi.mocked(consumeCode).mockResolvedValue(undefined)
  })

  it("rejects a malformed code without spending one of its tries", async () => {
    const payload = mockPayload()

    const result = await registerMember({ ...validRegistration, code: "12ab" })

    expect(result).toEqual({
      fieldErrors: { code: "Enter the 6-digit code from the email" },
      ok: false,
    })
    expect(checkCode).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("checks the details before the code, since every check spends a try", async () => {
    mockPayload()

    await registerMember({ ...validRegistration, firstName: "" })

    expect(checkCode).not.toHaveBeenCalled()
  })

  it.each([
    ["invalid", "That code isn't right. Check the email and try again."],
    ["expired", "This code has expired. Send a new one."],
    ["locked", "Too many incorrect tries. Send a new code."],
  ] as const)("refuses an %s code without creating the account", async (outcome, message) => {
    const payload = mockPayload()
    vi.mocked(checkCode).mockResolvedValue(outcome)

    const result = await registerMember(validRegistration)

    expect(result).toEqual({ fieldErrors: { code: message }, ok: false })
    expect(payload.create).not.toHaveBeenCalled()
    expect(consumeCode).not.toHaveBeenCalled()
  })

  it("reports a form error when the code can't be checked", async () => {
    const payload = mockPayload()
    vi.mocked(checkCode).mockRejectedValue(new Error("connection lost"))

    const result = await registerMember(validRegistration)

    expect(result).toEqual({ formError: "We couldn't check your code. Try again.", ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("uses up the code only after the account exists, then signs in", async () => {
    const payload = mockPayload()

    await registerMember(validRegistration)

    expect(checkCode).toHaveBeenCalledWith(validDetails.email, "482913")
    const order = [checkCode, payload.create, consumeCode, payload.login].map(
      (fn) => vi.mocked(fn).mock.invocationCallOrder[0],
    )
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it("keeps the code when creating the account fails, so it can be retried", async () => {
    mockPayload({ create: vi.fn().mockRejectedValue(new Error("connection lost")) })

    await registerMember(validRegistration)

    expect(consumeCode).not.toHaveBeenCalled()
  })

  it("still signs the member in when the used code can't be removed", async () => {
    const payload = mockPayload()
    vi.mocked(consumeCode).mockRejectedValue(new Error("connection lost"))

    const result = await registerMember(validRegistration)

    expect(result).toEqual({ ok: true })
    expect(payload.logger.error).toHaveBeenCalled()
  })

  it("rejects invalid input without touching Payload", async () => {
    const payload = mockPayload()

    const result = await registerMember({ ...validRegistration, firstName: "" })

    expect(result).toEqual({ fieldErrors: { firstName: "First name is required" }, ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("requires a position", async () => {
    const payload = mockPayload()

    const result = await registerMember({ ...validRegistration, position: "   " })

    expect(result).toEqual({ fieldErrors: { position: "Position is required" }, ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("passes the chosen title through to Payload", async () => {
    const payload = mockPayload()

    await registerMember({ ...validRegistration, title: "dr" })

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: "dr" }) }),
    )
  })

  it("requires the community guidelines to be accepted", async () => {
    mockPayload()

    const result = await registerMember({ ...validRegistration, agreedToTerms: false })

    expect(result.ok).toBe(false)
    expect(result).toHaveProperty("fieldErrors.agreedToTerms")
  })

  it("creates the member, signs them in and sets the auth cookie", async () => {
    const payload = mockPayload()

    const result = await registerMember(validRegistration)

    expect(result).toEqual({ ok: true })
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "members",
        // The institution reaches Payload as a number, not the form's string.
        data: expect.objectContaining({
          email: validDetails.email,
          institution: 1,
          position: "Senior Lecturer",
        }),
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

    const result = await registerMember(validRegistration)

    expect(result).toEqual({
      fieldErrors: { email: "Email domain does not match a registered domain." },
      ok: false,
    })
  })

  it("reports a generic failure when Payload throws something else", async () => {
    mockPayload({ create: vi.fn().mockRejectedValue(new Error("connection lost")) })

    const result = await registerMember(validRegistration)

    expect(result).toEqual({ formError: "Could not create your account. Try again.", ok: false })
  })

  it("falls back to a form error when a validation error has no usable field path", async () => {
    mockPayload({ create: vi.fn().mockRejectedValue(new ValidationError([])) })

    const result = await registerMember(validRegistration)

    expect(result).toEqual({ formError: "Could not create your account. Try again.", ok: false })
  })

  it("says the account exists when sign-in fails after creation", async () => {
    mockPayload({ login: vi.fn().mockRejectedValue(new Error("nope")) })

    const result = await registerMember(validRegistration)

    expect(result).toEqual({
      formError: "Account created, but signing you in failed. Try logging in.",
      ok: false,
    })
  })

  it("says the account exists when Payload logs in with no token", async () => {
    mockPayload({ login: vi.fn().mockResolvedValue({}) })

    const result = await registerMember(validRegistration)

    expect(result).toEqual({
      formError: "Account created, but signing you in failed. Try logging in.",
      ok: false,
    })
    expect(setCookie).not.toHaveBeenCalled()
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
    formData.set("bio", "  Teaches capstone.  ")
    formData.set("researchInterests", " Code review, , Generative AI ")
    formData.set("links", JSON.stringify([{ label: " GitHub ", url: "https://github.com/anna" }]))

    const result = await completeProfile(formData)

    expect(result).toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "members",
        data: expect.objectContaining({
          bio: "Teaches capstone.",
          // Blank entries between commas are dropped.
          researchInterests: ["Code review", "Generative AI"],
          links: [{ label: "GitHub", url: "https://github.com/anna" }],
        }),
        id: 7,
        // Access control must still apply - a member may only update themselves.
        overrideAccess: false,
      }),
    )
    expect(refresh).toHaveBeenCalled()
  })

  it("treats a profile with no interests or links as empty lists", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
      user: { firstName: "Anna", id: 7, lastName: "Tui" } as any,
    })
    const payload = mockPayload()

    const result = await completeProfile(new FormData())

    expect(result).toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ links: [], researchInterests: [] }),
      }),
    )
  })

  it.each([
    ["a non-web link", JSON.stringify([{ label: "Evil", url: "javascript:alert(1)" }])],
    ["malformed links", "{not json"],
  ])("rejects %s without touching Payload", async (_, links) => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
      user: { firstName: "Anna", id: 7, lastName: "Tui" } as any,
    })
    const payload = mockPayload()

    const formData = new FormData()
    formData.set("links", links)

    const result = await completeProfile(formData)

    expect(result.ok).toBe(false)
    expect(result).toHaveProperty("fieldErrors.links")
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("reports a form error when the avatar upload itself fails validation", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
      user: { firstName: "Anna", id: 7, lastName: "Tui" } as any,
    })
    // The Media collection's own paths (file, filename, alt) mean nothing to a
    // form that only renders bio, so this must never surface as fieldErrors.
    mockPayload({
      create: vi
        .fn()
        .mockRejectedValue(new ValidationError([{ message: "Invalid file type.", path: "file" }])),
    })

    const formData = new FormData()
    formData.set("bio", "")
    formData.set("avatar", new File(["data"], "photo.png", { type: "image/png" }))

    const result = await completeProfile(formData)

    expect(result).toEqual({ formError: "Could not upload your photo. Try again.", ok: false })
  })

  it("falls back to a form error when the profile update's validation error has no usable field path", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
      user: { firstName: "Anna", id: 7, lastName: "Tui" } as any,
    })
    mockPayload({ update: vi.fn().mockRejectedValue(new ValidationError([])) })

    const formData = new FormData()
    formData.set("bio", "")

    const result = await completeProfile(formData)

    expect(result).toEqual({ formError: "Could not save your profile. Try again.", ok: false })
  })
})

describe("sendVerificationCode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(issueCode).mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("emails a code once the details check out", async () => {
    mockPayload()

    const result = await sendVerificationCode(validDetails)

    expect(result).toEqual({ ok: true })
    expect(issueCode).toHaveBeenCalledWith(validDetails.email)
  })

  it("rejects invalid details without sending anything", async () => {
    mockPayload()

    const result = await sendVerificationCode({ ...validDetails, firstName: "" })

    expect(result).toEqual({ fieldErrors: { firstName: "First name is required" }, ok: false })
    expect(issueCode).not.toHaveBeenCalled()
  })

  it("refuses an institution that doesn't exist", async () => {
    mockPayload({ findByID: vi.fn().mockResolvedValue(null) })

    const result = await sendVerificationCode(validDetails)

    expect(result).toEqual({
      fieldErrors: { institution: "Selected institution does not exist." },
      ok: false,
    })
    expect(issueCode).not.toHaveBeenCalled()
  })

  it("refuses an email outside the institution's domains", async () => {
    mockPayload()

    const result = await sendVerificationCode({ ...validDetails, email: "a.tui@gmail.com" })

    expect(result).toEqual({
      fieldErrors: {
        email: "Email domain does not match a registered domain for Example University.",
      },
      ok: false,
    })
    expect(issueCode).not.toHaveBeenCalled()
  })

  it("refuses an email that already has an account, whatever its case", async () => {
    const payload = mockPayload({ count: vi.fn().mockResolvedValue({ totalDocs: 1 }) })

    const result = await sendVerificationCode({ ...validDetails, email: "A.Tui@Example.ac.nz" })

    expect(result).toEqual({
      fieldErrors: { email: "A user with the given email is already registered." },
      ok: false,
    })
    expect(payload.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: { equals: "a.tui@example.ac.nz" } } }),
    )
    expect(issueCode).not.toHaveBeenCalled()
  })

  it.each([
    [40, "You can ask for a new code in 40 seconds."],
    [1, "You can ask for a new code in 1 second."],
    [2_700, "You can ask for a new code in 45 minutes."],
  ])("passes on a %is wait before another code", async (retryAfterSeconds, message) => {
    mockPayload()
    vi.mocked(issueCode).mockResolvedValue({ error: "cooldown", ok: false, retryAfterSeconds })

    const result = await sendVerificationCode(validDetails)

    expect(result).toEqual({ formError: message, ok: false, retryAfterSeconds })
  })

  it("reports a code that couldn't be sent", async () => {
    mockPayload()
    vi.mocked(issueCode).mockResolvedValue({ error: "send-failed", ok: false })

    const result = await sendVerificationCode(validDetails)

    expect(result).toEqual({ formError: "We couldn't send your code. Try again.", ok: false })
  })

  it("reports a form error when sending throws", async () => {
    const payload = mockPayload()
    vi.mocked(issueCode).mockRejectedValue(new Error("connection lost"))

    const result = await sendVerificationCode(validDetails)

    expect(result).toEqual({ formError: "We couldn't send your code. Try again.", ok: false })
    expect(payload.logger.error).toHaveBeenCalled()
  })

  it("refuses to send in production when no email adapter is set up", async () => {
    vi.stubEnv("NODE_ENV", "production")
    mockPayload({ email: { name: "console" } })

    const result = await sendVerificationCode(validDetails)

    expect(result).toEqual({ formError: "We couldn't send your code. Try again later.", ok: false })
    expect(issueCode).not.toHaveBeenCalled()
  })

  it("sends through the console adapter outside production", async () => {
    mockPayload({ email: { name: "console" } })

    await expect(sendVerificationCode(validDetails)).resolves.toEqual({ ok: true })
  })
})
