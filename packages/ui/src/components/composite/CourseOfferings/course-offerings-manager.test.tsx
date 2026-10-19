import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CourseOfferingsManager, type CourseOfferingsManagerItem } from "./course-offerings-manager"

const items: CourseOfferingsManagerItem[] = [
  { id: 5, period: "Semester 2 2027", status: "draft", detail: "Capstone Project" },
  { id: 4, period: "Semester 1 2027", status: "published", detail: "1 Mar - 25 Jun" },
]

const renderManager = (overrides?: { onAdd?: () => void; onOpen?: (id: number) => void }) =>
  render(
    <CourseOfferingsManager
      courseCode="COMPSCI 399"
      items={items}
      onAdd={overrides?.onAdd ?? vi.fn()}
      onOpen={overrides?.onOpen ?? vi.fn()}
      open
    />,
  )

afterEach(() => {
  cleanup()
})

describe("CourseOfferingsManager", () => {
  it("lists every offering in order with its status", () => {
    renderManager()

    const rows = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent("Semester 2 2027Draft")
    expect(rows[0]).toHaveTextContent("Capstone Project")
    expect(rows[1]).toHaveTextContent("Semester 1 2027Published")
  })

  it("offers to edit a draft and to correct a published offering", async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    renderManager({ onOpen })

    await user.click(screen.getByRole("button", { name: "Edit Semester 2 2027" }))
    await user.click(screen.getByRole("button", { name: "Correct Semester 1 2027" }))

    expect(onOpen.mock.calls).toEqual([[5], [4]])
  })

  it("adds an offering", async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    renderManager({ onAdd })

    await user.click(screen.getByRole("button", { name: "Add offering" }))

    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it("names the course it manages", () => {
    renderManager()
    expect(screen.getByRole("dialog", { name: "Manage offerings" })).toHaveTextContent(
      "Every offering of COMPSCI 399",
    )
  })
})
