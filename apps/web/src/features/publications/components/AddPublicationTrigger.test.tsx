import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { AddPublicationTriggerForMember } from "./AddPublicationTrigger"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("./AddPublicationDialog", () => ({
  AddPublicationDialog: ({ defaultAuthorName }: { defaultAuthorName: string }) => (
    <button type="button">+ Add a publication as {defaultAuthorName}</button>
  ),
}))

const renderTrigger = async () => {
  const element = await AddPublicationTriggerForMember()
  return render(<div>{element}</div>)
}

describe("AddPublicationTriggerForMember", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the button to a member, with them as the default author", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { firstName: "Anna", id: 1, lastName: "Smith" },
    } as never)

    await renderTrigger()
    expect(
      screen.getByRole("button", { name: "+ Add a publication as Anna Smith" }),
    ).toBeInTheDocument()
  })

  it.each([
    ["a guest", { collection: null, user: null }],
    ["an admin", { collection: "admin", user: { id: 1 } }],
  ])("hides the button from %s", async (_, result) => {
    vi.mocked(getCurrentUser).mockResolvedValue(result as never)

    await renderTrigger()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
