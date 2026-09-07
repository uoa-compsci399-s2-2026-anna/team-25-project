import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

function renderTabs(props?: {
  listVariant?: "pill" | "segmented" | "outline" | "ghost"
  disablePassword?: boolean
}) {
  return render(
    <Tabs defaultValue="account">
      <TabsList variant={props?.listVariant}>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger disabled={props?.disablePassword} value="password">
          Password
        </TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account panel</TabsContent>
      <TabsContent value="password">Password panel</TabsContent>
      <TabsContent value="team">Team panel</TabsContent>
    </Tabs>,
  )
}

describe("Tabs", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders every trigger as a tab and shows the default panel", () => {
    renderTabs()
    expect(screen.getAllByRole("tab")).toHaveLength(3)
    expect(screen.getByText("Account panel")).toBeVisible()
    expect(screen.queryByText("Team panel")).not.toBeInTheDocument()
  })

  it("selects the tab matching defaultValue on mount", () => {
    renderTabs()
    expect(screen.getByRole("tab", { name: "Account" })).toHaveAttribute("aria-selected", "true")
  })

  it("activates a tab and its panel when clicked", () => {
    renderTabs()
    fireEvent.click(screen.getByRole("tab", { name: "Password" }))
    expect(screen.getByRole("tab", { name: "Password" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByText("Password panel")).toBeVisible()
    expect(screen.queryByText("Account panel")).not.toBeInTheDocument()
  })

  it("does not switch to a disabled tab when clicked", () => {
    renderTabs({ disablePassword: true })
    const password = screen.getByRole("tab", { name: "Password" })
    expect(password).toHaveAttribute("aria-disabled", "true")
    fireEvent.click(password)
    expect(password).toHaveAttribute("aria-selected", "false")
    expect(screen.getByText("Account panel")).toBeVisible()
  })

  it("defaults to the pill variant and renders its indicator", () => {
    const { container } = renderTabs()
    const list = container.querySelector("[data-slot=tabs-list]")
    expect(list).toHaveAttribute("data-variant", "pill")
    expect(list).toHaveClass("bg-muted", "rounded-full")
    expect(container.querySelector("[data-slot=tabs-indicator]")).toHaveClass(
      "group-data-[variant=pill]/tabs-list:rounded-full",
    )
  })

  it("styles the indicator and active trigger for the segmented variant", () => {
    const { container } = renderTabs({ listVariant: "segmented" })
    expect(container.querySelector("[data-slot=tabs-list]")).toHaveAttribute(
      "data-variant",
      "segmented",
    )
    expect(container.querySelector("[data-slot=tabs-indicator]")).toHaveClass(
      "group-data-[variant=segmented]/tabs-list:bg-brand-salmon",
    )
    expect(screen.getByRole("tab", { name: "Account" })).toHaveClass(
      "group-data-[variant=segmented]/tabs-list:data-active:text-brand-plum",
    )
  })

  it("gives the outline variant a bordered indicator on a transparent list", () => {
    const { container } = renderTabs({ listVariant: "outline" })
    const list = container.querySelector("[data-slot=tabs-list]")
    expect(list).toHaveAttribute("data-variant", "outline")
    expect(list).toHaveClass("bg-transparent")
    expect(container.querySelector("[data-slot=tabs-indicator]")).toHaveClass(
      "group-data-[variant=outline]/tabs-list:border",
      "group-data-[variant=outline]/tabs-list:bg-background",
    )
  })

  it("gives the ghost variant a muted indicator on a transparent list", () => {
    const { container } = renderTabs({ listVariant: "ghost" })
    const list = container.querySelector("[data-slot=tabs-list]")
    expect(list).toHaveAttribute("data-variant", "ghost")
    expect(list).toHaveClass("bg-transparent")
    expect(container.querySelector("[data-slot=tabs-indicator]")).toHaveClass(
      "group-data-[variant=ghost]/tabs-list:bg-muted",
    )
  })

  it("reserves the active (semibold) width with a hidden bold twin so switching never shifts", () => {
    renderTabs()
    const trigger = screen.getByRole("tab", { name: "Account" })
    const twin = trigger.querySelector("span[aria-hidden]")
    expect(twin).toHaveClass("invisible", "font-semibold")
    expect(twin).toHaveTextContent("Account")
    // aria-hidden twin must not leak into the accessible name
    expect(screen.getByRole("tab", { name: "Account" })).toBeInTheDocument()
  })

  it("merges a custom className on each slot", () => {
    const { container } = render(
      <Tabs className="tabs-cn" defaultValue="account">
        <TabsList className="list-cn">
          <TabsTrigger className="trigger-cn" value="account">
            Account
          </TabsTrigger>
        </TabsList>
        <TabsContent className="content-cn" value="account">
          Account panel
        </TabsContent>
      </Tabs>,
    )
    expect(container.querySelector("[data-slot=tabs]")).toHaveClass("tabs-cn")
    expect(container.querySelector("[data-slot=tabs-list]")).toHaveClass("list-cn")
    expect(container.querySelector("[data-slot=tabs-trigger]")).toHaveClass("trigger-cn")
    expect(container.querySelector("[data-slot=tabs-content]")).toHaveClass("content-cn")
  })
})
