import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { PostProposalTriggerForMember } from "./PostProposalTrigger"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("./PostProposalDialog", () => ({
  PostProposalDialog: () => <button type="button">+ Post a proposal</button>,
}))

describe("PostProposalTriggerForMember", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the button to a member", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 1 },
    } as never)

    render(await PostProposalTriggerForMember())
    expect(screen.getByRole("button", { name: "+ Post a proposal" })).toBeInTheDocument()
  })

  it.each([
    ["an admin", { collection: "admin", user: { id: 1 } }],
    ["a guest", { collection: null, user: null }],
  ])("hides the button from %s", async (_, current) => {
    vi.mocked(getCurrentUser).mockResolvedValue(current as never)

    expect(await PostProposalTriggerForMember()).toBeNull()
  })
})
