import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { TagsCard } from "./TagsCard"

describe("TagsCard", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders a badge per tag with its label", () => {
    render(<TagsCard tags={["assessment", "quantitative"]} />)
    expect(screen.getByText("Assessment")).toBeInTheDocument()
    expect(screen.getByText("Quantitative")).toBeInTheDocument()
  })

  it("renders every tag with the same variant", () => {
    render(<TagsCard tags={["assessment", "quantitative"]} />)
    expect(screen.getByText("Assessment")).toHaveAttribute("data-variant", "blue")
    expect(screen.getByText("Quantitative")).toHaveAttribute("data-variant", "blue")
  })

  it("renders nothing when there are no tags", () => {
    const { container } = render(<TagsCard tags={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing when tags is null", () => {
    const { container } = render(<TagsCard tags={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
