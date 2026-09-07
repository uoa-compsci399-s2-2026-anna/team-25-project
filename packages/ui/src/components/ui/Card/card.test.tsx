import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardIcon,
  CardTitle,
} from "./card"

describe("Card", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders children", () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText("Card content")).toBeInTheDocument()
  })

  it("applies the default size classes", () => {
    render(<Card data-testid="card">Card</Card>)
    expect(screen.getByTestId("card")).toHaveAttribute("data-size", "default")
    expect(screen.getByTestId("card")).toHaveClass("bg-brand-cream")
  })

  it("applies the sm size when passed", () => {
    render(
      <Card data-testid="card" size="sm">
        Card
      </Card>,
    )
    expect(screen.getByTestId("card")).toHaveAttribute("data-size", "sm")
  })

  it("merges a custom className with variant classes", () => {
    render(
      <Card className="custom-class" data-testid="card">
        Card
      </Card>,
    )
    expect(screen.getByTestId("card")).toHaveClass("custom-class")
  })

  it("renders the composite parts together", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    )

    expect(screen.getByText("Title")).toBeInTheDocument()
    expect(screen.getByText("Description")).toBeInTheDocument()
    expect(screen.getByText("Action")).toBeInTheDocument()
    expect(screen.getByText("Content")).toBeInTheDocument()
    expect(screen.getByText("Footer")).toBeInTheDocument()
  })

  it("renders the icon slot", () => {
    render(
      <Card>
        <CardHeader>
          <CardIcon data-testid="card-icon">Icon</CardIcon>
        </CardHeader>
      </Card>,
    )
    expect(screen.getByTestId("card-icon")).toHaveAttribute("data-slot", "card-icon")
    expect(screen.getByTestId("card-icon")).toHaveClass("[&>svg]:size-full")
  })

  it("applies the padding token class to CardContent", () => {
    render(<CardContent data-testid="card-content">Content</CardContent>)
    expect(screen.getByTestId("card-content")).toHaveClass("px-(--card-spacing)")
  })

  it("positions CardAction with the grid placement classes", () => {
    render(<CardAction data-testid="card-action">Action</CardAction>)
    expect(screen.getByTestId("card-action")).toHaveClass("col-start-2", "row-span-2")
  })

  it("renders a header with just a title", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title only</CardTitle>
        </CardHeader>
      </Card>,
    )
    expect(screen.getByText("Title only")).toBeInTheDocument()
  })
})
