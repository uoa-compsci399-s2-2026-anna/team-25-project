import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CourseOfferingSwitcher } from "./CourseOfferingSwitcher"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const options = [
  { id: 14, period: "Semester 1 2027", timing: "upcoming" as const },
  { id: 1, period: "Semester 2 2026", timing: "inProgress" as const },
  { id: 12, period: "Semester 2 2025", timing: "ended" as const },
]

const renderSwitcher = (selectedId = 1) =>
  render(
    <CourseOfferingSwitcher courseId={7} currentId={1} options={options} selectedId={selectedId} />,
  )

// The list and labels are the design system's (course-offerings.test.tsx); this
// covers what picking one navigates to.
describe("CourseOfferingSwitcher", () => {
  afterEach(() => {
    cleanup()
    push.mockClear()
  })

  it("opens another offering by its id", async () => {
    const user = userEvent.setup()
    renderSwitcher()

    await user.click(screen.getByRole("combobox", { name: "Offering" }))
    await user.click(await screen.findByRole("option", { name: "Semester 2 2025" }))

    expect(push).toHaveBeenCalledWith("/courses/7?offering=12", { scroll: false })
  })

  // The plain URL is the current offering's canonical address.
  it("goes back to the plain course URL for the current offering", async () => {
    const user = userEvent.setup()
    renderSwitcher(12)

    await user.click(screen.getByRole("combobox", { name: "Offering" }))
    await user.click(await screen.findByRole("option", { name: "Semester 2 2026 (In progress)" }))

    expect(push).toHaveBeenCalledWith("/courses/7", { scroll: false })
  })
})
