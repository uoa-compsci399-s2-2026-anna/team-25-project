import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PublicationAbstract } from "./publication-abstract"

const abstract = "We follow four capstone cohorts over two years."

// jsdom does no layout, so fake the clamped text being taller than its box.
const mockOverflow = (overflows: boolean) => {
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(overflows ? 120 : 60)
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(60)
}

describe("PublicationAbstract", () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("clamps the abstract with no toggle when it fits", () => {
    mockOverflow(false)
    render(<PublicationAbstract>{abstract}</PublicationAbstract>)

    expect(screen.getByText(abstract)).toHaveClass("line-clamp-3")
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("offers to show more when the abstract overflows the clamp", () => {
    mockOverflow(true)
    render(<PublicationAbstract>{abstract}</PublicationAbstract>)

    const toggle = screen.getByRole("button", { name: "Show more" })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(toggle).toHaveAttribute("aria-controls", screen.getByText(abstract).id)
  })

  it("expands and collapses the abstract", async () => {
    mockOverflow(true)
    const user = userEvent.setup()
    render(<PublicationAbstract>{abstract}</PublicationAbstract>)

    await user.click(screen.getByRole("button", { name: "Show more" }))
    expect(screen.getByText(abstract)).not.toHaveClass("line-clamp-3")
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )

    await user.click(screen.getByRole("button", { name: "Show less" }))
    expect(screen.getByText(abstract)).toHaveClass("line-clamp-3")
    expect(screen.getByRole("button", { name: "Show more" })).toBeInTheDocument()
  })
})
