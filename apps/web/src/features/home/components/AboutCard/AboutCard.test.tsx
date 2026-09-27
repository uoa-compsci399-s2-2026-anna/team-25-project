import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { AboutCard } from "./AboutCard"

const props = {
  description: "Maintain a directory of capstone academics.",
  number: "01",
  title: "Member directory",
}

describe("AboutCard", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the number, title and description", () => {
    render(<AboutCard {...props} />)
    expect(screen.getByText("01")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 3, name: "Member directory" })).toBeInTheDocument()
    expect(screen.getByText("Maintain a directory of capstone academics.")).toBeInTheDocument()
  })
})
