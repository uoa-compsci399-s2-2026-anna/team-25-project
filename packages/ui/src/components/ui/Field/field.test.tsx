import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { Input } from "../Input/input"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "./field"

describe("Field", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders children", () => {
    render(<Field>Email</Field>)
    expect(screen.getByText("Email")).toBeInTheDocument()
  })

  it("defaults to the vertical orientation", () => {
    render(<Field>Email</Field>)
    const field = screen.getByText("Email")
    expect(field).toHaveAttribute("data-orientation", "vertical")
    expect(field).toHaveClass("flex-col")
  })

  it("switches to the horizontal orientation", () => {
    render(<Field orientation="horizontal">Email</Field>)
    const field = screen.getByText("Email")
    expect(field).toHaveAttribute("data-orientation", "horizontal")
    expect(field).toHaveClass("flex-row")
  })

  it("merges a custom className with the default classes", () => {
    render(<Field className="custom-class">Email</Field>)
    expect(screen.getByText("Email")).toHaveClass("flex", "custom-class")
  })

  it("renders FieldContent as its own slot", () => {
    render(<FieldContent>Details</FieldContent>)
    expect(screen.getByText("Details")).toHaveAttribute("data-slot", "field-content")
  })

  it("renders FieldLabel as a label tied to the given control", () => {
    render(<FieldLabel htmlFor="email">Email</FieldLabel>)
    const label = screen.getByText("Email")
    expect(label.tagName).toBe("LABEL")
    expect(label).toHaveAttribute("for", "email")
    expect(label).toHaveAttribute("data-slot", "field-label")
  })

  it("grows FieldLabel to fill the width when it wraps a Field", () => {
    render(<FieldLabel htmlFor="email">Email</FieldLabel>)
    expect(screen.getByText("Email")).toHaveClass("has-[>[data-slot=field]]:w-full")
  })

  it("renders FieldTitle as its own slot", () => {
    render(<FieldTitle>Marketing emails</FieldTitle>)
    expect(screen.getByText("Marketing emails")).toHaveAttribute("data-slot", "field-title")
  })

  it("renders FieldDescription text and styles nested links", () => {
    const { container } = render(
      <FieldDescription>
        See <a href="/terms">terms</a>
      </FieldDescription>,
    )
    const description = container.querySelector("[data-slot=field-description]")
    expect(description).toHaveTextContent("See terms")
    expect(description).toHaveClass("[&>a]:underline")
  })

  it("renders FieldError children when given", () => {
    render(<FieldError>Something went wrong</FieldError>)
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong")
  })

  it("renders a single FieldError message from errors", () => {
    render(<FieldError errors={[{ message: "Required" }]} />)
    expect(screen.getByRole("alert")).toHaveTextContent("Required")
  })

  it("renders deduplicated FieldError messages as a list", () => {
    render(
      <FieldError
        errors={[{ message: "Required" }, { message: "Required" }, { message: "Too short" }]}
      />,
    )
    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent("Required")
    expect(items[1]).toHaveTextContent("Too short")
  })

  it("renders nothing for FieldError when there are no errors or children", () => {
    const { container } = render(<FieldError />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders FieldSeparator without a content span by default", () => {
    const { container } = render(<FieldSeparator />)
    expect(container.querySelector("[data-slot=field-separator]")).toHaveAttribute(
      "data-content",
      "false",
    )
    expect(container.querySelector("[data-slot=field-separator-content]")).not.toBeInTheDocument()
  })

  it("renders FieldSeparator content when children are given", () => {
    const { container } = render(<FieldSeparator>or</FieldSeparator>)
    expect(container.querySelector("[data-slot=field-separator]")).toHaveAttribute(
      "data-content",
      "true",
    )
    expect(screen.getByText("or")).toHaveAttribute("data-slot", "field-separator-content")
  })

  it("renders FieldSet as a fieldset", () => {
    render(<FieldSet>Profile</FieldSet>)
    const fieldset = screen.getByText("Profile")
    expect(fieldset.tagName).toBe("FIELDSET")
    expect(fieldset).toHaveAttribute("data-slot", "field-set")
  })

  it("defaults FieldLegend to the legend variant and supports the label variant", () => {
    const { rerender } = render(<FieldLegend>Profile</FieldLegend>)
    const legend = screen.getByText("Profile")
    expect(legend.tagName).toBe("LEGEND")
    expect(legend).toHaveAttribute("data-variant", "legend")

    rerender(<FieldLegend variant="label">Profile</FieldLegend>)
    expect(screen.getByText("Profile")).toHaveAttribute("data-variant", "label")
  })

  it("renders FieldGroup as its own slot", () => {
    render(<FieldGroup>Fields</FieldGroup>)
    expect(screen.getByText("Fields")).toHaveAttribute("data-slot", "field-group")
  })

  it("focuses the paired input when its FieldLabel is clicked", async () => {
    const user = userEvent.setup()
    const id = crypto.randomUUID()
    render(
      <Field>
        <FieldLabel htmlFor={id}>Email</FieldLabel>
        <Input id={id} type="text" />
      </Field>,
    )
    await user.click(screen.getByText("Email"))
    expect(screen.getByRole("textbox")).toHaveFocus()
  })
})
