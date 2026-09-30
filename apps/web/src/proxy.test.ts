import type { Admin, Member } from "@repo/shared/payload-types"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { config, proxy } from "./proxy"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const ORIGIN = "http://localhost:3000"

const request = (path: string) => new NextRequest(new URL(path, ORIGIN))

const location = (response: Response) => {
  const header = response.headers.get("location")
  if (!header) return null
  const url = new URL(header)
  return url.pathname + url.search
}

const asGuest = () => vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })

const asMember = (member: Partial<Member> = { registrationCompletedAt: "2026-01-01" }) =>
  vi.mocked(getCurrentUser).mockResolvedValue({
    collection: Slugs.Collections.MEMBERS,
    user: { id: 1, ...member } as Member,
  })

const asAdmin = () =>
  vi.mocked(getCurrentUser).mockResolvedValue({
    collection: Slugs.Collections.ADMIN,
    user: { id: 1 } as Admin,
  })

const memberRoutes = [
  "/proposals",
  "/proposals/12-solar-farm",
  "/courses",
  "/courses/abc",
  "/resources",
  "/resources/xyz",
]

const guestRoutes = ["/login", "/register"]

beforeEach(() => {
  vi.resetAllMocks()
})

describe("config.matcher", () => {
  it("matches every guarded route pattern", () => {
    expect(config.matcher).toEqual([
      "/login",
      "/register",
      "/proposals",
      "/proposals/:idSlug",
      "/courses",
      "/courses/:courseId",
      "/resources",
      "/resources/:resourceId",
    ])
  })
})

describe("member routes", () => {
  it.each(memberRoutes)(
    "redirects a guest from %s to login with a redirect param",
    async (path) => {
      asGuest()

      const response = await proxy(request(path))

      expect(response.status).toBe(307)
      expect(location(response)).toBe(`/login?${new URLSearchParams({ redirect: path })}`)
    },
  )

  it("keeps the query string in the redirect param", async () => {
    asGuest()

    const response = await proxy(request("/courses?page=2"))

    expect(location(response)).toBe(
      `/login?${new URLSearchParams({ redirect: "/courses?page=2" })}`,
    )
  })

  it.each(memberRoutes)("lets a member through to %s", async (path) => {
    asMember()

    const response = await proxy(request(path))

    expect(location(response)).toBeNull()
    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it.each(memberRoutes)("lets an admin through to %s", async (path) => {
    asAdmin()

    const response = await proxy(request(path))

    expect(location(response)).toBeNull()
  })

  it("does not guard a nested path below a detail route", async () => {
    asGuest()

    const response = await proxy(request("/courses/abc/edit"))

    expect(location(response)).toBeNull()
  })
})

describe("guest routes", () => {
  it.each(guestRoutes)("lets a guest through to %s", async (path) => {
    asGuest()

    const response = await proxy(request(path))

    expect(location(response)).toBeNull()
  })

  it.each(guestRoutes)("redirects a member from %s to home", async (path) => {
    asMember()

    const response = await proxy(request(path))

    expect(location(response)).toBe("/")
  })

  it.each(guestRoutes)("redirects an admin from %s to home", async (path) => {
    asAdmin()

    const response = await proxy(request(path))

    expect(location(response)).toBe("/")
  })

  it.each(guestRoutes)("redirects a member from %s to a safe redirect param", async (path) => {
    asMember()

    const response = await proxy(request(`${path}?redirect=/courses/abc`))

    expect(location(response)).toBe("/courses/abc")
  })

  it.each(guestRoutes)("ignores an off-site redirect param on %s", async (path) => {
    asMember()

    const response = await proxy(request(`${path}?redirect=//evil.com`))

    expect(location(response)).toBe("/")
  })

  it.each(guestRoutes)(
    "sends a half-registered member from %s to step two with the redirect param",
    async (path) => {
      asMember({ registrationCompletedAt: null })

      const response = await proxy(request(`${path}?redirect=/resources`))

      expect(location(response)).toBe(
        `/register/profile?${new URLSearchParams({ redirect: "/resources" })}`,
      )
    },
  )
})
