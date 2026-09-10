import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select"

// SelectValue displays the raw selected value unless an `items` map or a render
// function is supplied, so item values match their visible label here to keep
// assertions on the trigger text meaningful.
function renderSelect(props?: {
  defaultValue?: string
  value?: string
  disabled?: boolean
  onValueChange?: (value: string | null) => void
}) {
  return render(
    <Select
      defaultValue={props?.defaultValue}
      disabled={props?.disabled}
      onValueChange={props?.onValueChange}
      value={props?.value}
    >
      <SelectTrigger>
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="Apple">Apple</SelectItem>
          <SelectItem value="Banana">Banana</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectItem value="Cherry">Cherry</SelectItem>
      </SelectContent>
    </Select>,
  )
}

async function openSelect(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox"))
  await screen.findByRole("listbox")
}

describe("Select", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the placeholder when no value is selected", () => {
    renderSelect()
    expect(screen.getByRole("combobox")).toHaveTextContent("Pick a fruit")
  })

  it("shows the selected item's value when defaultValue is set", () => {
    renderSelect({ defaultValue: "Apple" })
    expect(screen.getByRole("combobox")).toHaveTextContent("Apple")
  })

  it("opens the listbox when the trigger is clicked", async () => {
    const user = userEvent.setup()
    renderSelect()
    const trigger = screen.getByRole("combobox")
    expect(trigger).toHaveAttribute("aria-expanded", "false")

    await openSelect(user)

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Banana" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Cherry" })).toBeInTheDocument()
  })

  it("selects an item on click and closes the popup", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderSelect({ onValueChange })
    await openSelect(user)

    await user.click(screen.getByRole("option", { name: "Banana" }))

    expect(onValueChange).toHaveBeenCalledWith("Banana", expect.anything())
    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveTextContent("Banana")
    })
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "false")
  })

  it("does not open when disabled", () => {
    renderSelect({ disabled: true })
    const trigger = screen.getByRole("combobox")
    expect(trigger).toBeDisabled()

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("supports being used as a controlled component", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = renderSelect({ value: "Apple", onValueChange })
    expect(screen.getByRole("combobox")).toHaveTextContent("Apple")

    await openSelect(user)
    await user.click(screen.getByRole("option", { name: "Cherry" }))
    expect(onValueChange).toHaveBeenCalledWith("Cherry", expect.anything())
    // Controlled: displayed value only changes once the `value` prop is updated.
    expect(screen.getByRole("combobox")).toHaveTextContent("Apple")

    rerender(
      <Select onValueChange={onValueChange} value="Cherry">
        <SelectTrigger>
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="Apple">Apple</SelectItem>
            <SelectItem value="Banana">Banana</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectItem value="Cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>,
    )
    expect(screen.getByRole("combobox")).toHaveTextContent("Cherry")
  })

  it("applies data-slot attributes to the trigger, content, group, label, item, and separator", async () => {
    const user = userEvent.setup()
    renderSelect()
    expect(screen.getByRole("combobox")).toHaveAttribute("data-slot", "select-trigger")

    await openSelect(user)

    expect(document.querySelector("[data-slot=select-content]")).toBeInTheDocument()
    expect(document.querySelector("[data-slot=select-group]")).toBeInTheDocument()
    expect(document.querySelector("[data-slot=select-label]")).toHaveTextContent("Fruits")
    expect(document.querySelector("[data-slot=select-separator]")).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute(
      "data-slot",
      "select-item",
    )
  })

  it("merges a custom className onto the trigger", () => {
    render(
      <Select>
        <SelectTrigger className="custom-class">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    )
    expect(screen.getByRole("combobox")).toHaveClass("custom-class")
  })
})
