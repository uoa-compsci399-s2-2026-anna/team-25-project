import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import { EmptyState } from "./EmptyState"

describe("EmptyState", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the action as a link to its href", () => {
    render(
      <EmptyState
        action={{ href: Routes.COURSES.ROOT, label: "Browse courses" }}
        icon={<svg />}
        title="No courses yet"
        variant="list"
      />,
    )
    expect(screen.getByRole("link", { name: "Browse courses" })).toHaveAttribute(
      "href",
      Routes.COURSES.ROOT,
    )
  })

  it("leaves out the description and action when they are not passed", () => {
    const { container } = render(
      <EmptyState icon={<svg />} title="No courses yet" variant="list" />,
    )
    expect(container.querySelector('[data-slot="empty-description"]')).not.toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
