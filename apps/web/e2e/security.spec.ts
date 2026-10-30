import { expect, test } from "@playwright/test"
import type { Institution, Member } from "@repo/shared/payload-types"
import { MEMBER_STORAGE_STATE } from "./auth-state"

const API = "/payload/api"

test.describe("as a member", () => {
  test.use({ storageState: MEMBER_STORAGE_STATE })

  test("a member cannot change their email or institution through the API", async ({ page }) => {
    const me = await page.request.get(`${API}/members/me?depth=0`)
    const { user } = (await me.json()) as { user: Member }
    expect(user.firstName).toBe("Arohan")

    const institutions = await page.request.get(
      `${API}/institutions?where[name][equals]=University of Otago&depth=0`,
    )
    const [otago] = ((await institutions.json()) as { docs: Institution[] }).docs
    // A matching pair, so only the access rule can refuse it, not the domain check.
    const response = await page.request.patch(`${API}/members/${user.id}`, {
      data: { email: "arohan@otago.ac.nz", institution: otago.id },
    })
    expect(response.status()).toBe(403)

    const after = await page.request.get(`${API}/members/${user.id}?depth=0`)
    const member = (await after.json()) as Member
    expect(member.email).toBe(user.email)
    expect(member.institution).toBe(user.institution)
  })

  test("a member cannot set a password through the API", async ({ page }) => {
    const me = await page.request.get(`${API}/members/me?depth=0`)
    const { user } = (await me.json()) as { user: Member }

    // The seeded password, so a broken guard does not lock out other tests.
    const response = await page.request.patch(`${API}/members/${user.id}`, {
      data: { password: "changeme" },
    })
    expect(response.status()).toBe(403)
  })
})
