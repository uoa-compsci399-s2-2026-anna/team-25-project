import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { AuthorByline } from "./AuthorByline"

const member = (
  overrides: Partial<Parameters<typeof AuthorByline>[0]["authors"][number]> = {},
) => ({
  id: 1,
  firstName: "Anna",
  lastName: "Tui",
  institution: { id: 1, name: "University of Example" },
  ...overrides,
})

describe("AuthorByline", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders a single author's name and institution", () => {
    render(<AuthorByline authors={[member()]} />)
    expect(screen.getByText("Anna Tui")).toBeInTheDocument()
    expect(screen.getByText("University of Example")).toBeInTheDocument()
  })

  it("joins multiple authors' names with a comma", () => {
    render(
      <AuthorByline authors={[member(), member({ id: 2, firstName: "Ben", lastName: "Lee" })]} />,
    )
    expect(screen.getByText("Anna Tui, Ben Lee")).toBeInTheDocument()
  })

  it("joins multiple institutions with a comma", () => {
    render(
      <AuthorByline
        authors={[
          member(),
          member({
            id: 2,
            firstName: "Ben",
            lastName: "Lee",
            institution: { id: 2, name: "Victoria University" },
          }),
        ]}
      />,
    )
    expect(screen.getByText("University of Example, Victoria University")).toBeInTheDocument()
  })

  it("only lists an institution once when authors share it", () => {
    render(
      <AuthorByline authors={[member(), member({ id: 2, firstName: "Ben", lastName: "Lee" })]} />,
    )
    expect(screen.getByText("University of Example")).toBeInTheDocument()
  })

  it("renders one avatar per author", () => {
    render(
      <AuthorByline authors={[member(), member({ id: 2, firstName: "Ben", lastName: "Lee" })]} />,
    )
    expect(screen.getAllByText("AT")).toHaveLength(1)
    expect(screen.getByText("BL")).toBeInTheDocument()
  })

  it("falls back to initials when there is no avatar", () => {
    render(<AuthorByline authors={[member()]} />)
    expect(screen.getByText("AT")).toBeInTheDocument()
  })

  // jsdom never resolves an <img> load, so Base UI's Avatar.Image never
  // reaches "loaded" and the fallback stays in the DOM either way - this
  // only proves the avatar branch doesn't crash or drop the fallback,
  // not that the image itself renders. Same as ProposalCard's own avatar test.
  it("keeps the initials showing until the author's avatar loads", () => {
    render(
      <AuthorByline
        authors={[member({ avatar: { id: 1, url: "https://example.com/anna.jpg" } })]}
      />,
    )
    expect(screen.getByText("AT")).toBeVisible()
  })

  it("does not render an institution line when institution isn't populated", () => {
    render(<AuthorByline authors={[member({ institution: 1 })]} />)
    expect(screen.queryByText("University of Example")).not.toBeInTheDocument()
  })

  it("only uses the last initial when the first name is blank", () => {
    render(<AuthorByline authors={[member({ firstName: "" })]} />)
    expect(screen.getByText("T")).toBeInTheDocument()
  })

  it("only uses the first initial when the last name is blank", () => {
    render(<AuthorByline authors={[member({ lastName: "" })]} />)
    expect(screen.getByText("A")).toBeInTheDocument()
  })
})
