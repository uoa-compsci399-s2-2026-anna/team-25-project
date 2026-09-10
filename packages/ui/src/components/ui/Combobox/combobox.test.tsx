import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxClear,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxValue,
} from "./combobox"

const fruits = ["Apple", "Banana", "Cherry"]

function renderCombobox(props?: {
  ariaInvalid?: boolean
  defaultValue?: string
  disabled?: boolean
  showClear?: boolean
  variant?: "field" | "pill"
  onValueChange?: (value: string | null) => void
}) {
  return render(
    <Combobox
      defaultValue={props?.defaultValue}
      disabled={props?.disabled}
      items={fruits}
      onValueChange={props?.onValueChange}
    >
      <ComboboxInput
        aria-invalid={props?.ariaInvalid}
        placeholder="Pick a fruit..."
        showClear={props?.showClear}
        variant={props?.variant}
      />
      <ComboboxContent>
        <ComboboxEmpty>No fruit found.</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection>
            {(fruit: string) => (
              <ComboboxItem key={fruit} value={fruit}>
                {fruit}
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  )
}

describe("Combobox", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the input with a placeholder", () => {
    renderCombobox()
    expect(screen.getByPlaceholderText("Pick a fruit...")).toBeInTheDocument()
  })

  it("opens the list and shows every item when the trigger is clicked", async () => {
    const user = userEvent.setup()
    renderCombobox()
    await user.click(screen.getByRole("combobox"))
    for (const fruit of fruits) {
      expect(await screen.findByRole("option", { name: fruit })).toBeInTheDocument()
    }
  })

  it("filters the list as the user types", async () => {
    const user = userEvent.setup()
    renderCombobox()
    await user.type(screen.getByPlaceholderText("Pick a fruit..."), "Ban")
    expect(await screen.findByRole("option", { name: "Banana" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "Apple" })).not.toBeInTheDocument()
  })

  it("shows the empty state when nothing matches", async () => {
    const user = userEvent.setup()
    renderCombobox()
    await user.type(screen.getByPlaceholderText("Pick a fruit..."), "zzz")
    // findByText matches hidden nodes; this live region must be shown to announce.
    expect(await screen.findByText("No fruit found.")).toBeVisible()
  })

  it("calls onValueChange when an item is selected", async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    renderCombobox({ onValueChange })
    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Cherry" }))
    expect(onValueChange).toHaveBeenCalledWith("Cherry", expect.anything())
  })

  it("does not open when disabled", async () => {
    const user = userEvent.setup()
    renderCombobox({ disabled: true })
    const input = screen.getByPlaceholderText("Pick a fruit...")
    // Natively disabled, not merely styled that way: `data-disabled` alone still leaves
    // the input focusable, typeable and unannounced to assistive tech.
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute("data-disabled")
    await user.click(input)
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })

  it("opens, moves through the list and selects with the keyboard", async () => {
    const user = userEvent.setup()
    renderCombobox()
    const input = screen.getByPlaceholderText("Pick a fruit...")
    await user.click(input)
    await user.clear(input)

    // The first ArrowDown opens the list and highlights the first item, so the second
    // moves the highlight on — landing on Banana proves the arrow key travels.
    await user.keyboard("{ArrowDown}")
    expect(await screen.findByRole("option", { name: "Apple" })).toBeInTheDocument()

    await user.keyboard("{ArrowDown}{Enter}")
    expect(input).toHaveValue("Banana")
  })

  it("closes the list on Escape", async () => {
    const user = userEvent.setup()
    renderCombobox()
    await user.click(screen.getByRole("combobox"))
    expect(await screen.findByRole("option", { name: "Apple" })).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })

  it("clears the selected value when the clear button is clicked", async () => {
    const user = userEvent.setup()
    renderCombobox({ defaultValue: "Cherry", showClear: true })
    const input = screen.getByPlaceholderText("Pick a fruit...")
    expect(input).toHaveValue("Cherry")

    await user.click(screen.getByRole("button", { name: "Clear selection" }))
    expect(input).toHaveValue("")
  })

  it("keeps the invalid input matchable by the shell's error selector", () => {
    // Both attributes must survive the render prop, or the shell's error selector misses.
    renderCombobox({ ariaInvalid: true })
    const input = screen.getByPlaceholderText("Pick a fruit...")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveAttribute("data-slot", "input-group-control")
  })

  it("omits the addon entirely when neither the trigger nor the clear button is shown", () => {
    // An addon rendered empty is still a `cursor-text` click-to-focus target, so the
    // whole slot has to go, not just its contents.
    const { container } = render(
      <Combobox items={fruits}>
        <ComboboxInput placeholder="Pick a fruit..." showTrigger={false} />
      </Combobox>,
    )
    expect(screen.queryByRole("button", { name: "Open list" })).not.toBeInTheDocument()
    expect(container.querySelector("[data-slot=input-group-addon]")).not.toBeInTheDocument()
  })

  it("applies the data-slot attributes", async () => {
    const user = userEvent.setup()
    const { container } = renderCombobox()
    expect(container.querySelector("[data-slot=input-group]")).toBeInTheDocument()
    await user.click(screen.getByRole("combobox"))
    expect(await screen.findByRole("option", { name: "Apple" })).toHaveAttribute(
      "data-slot",
      "combobox-item",
    )
  })

  it("renders a clear button only when showClear is set and a value is selected", () => {
    const { container, unmount } = renderCombobox({ defaultValue: "Cherry" })
    expect(container.querySelector("[data-slot=combobox-clear]")).not.toBeInTheDocument()
    unmount()

    const withClear = renderCombobox({ defaultValue: "Cherry", showClear: true })
    expect(withClear.container.querySelector("[data-slot=combobox-clear]")).toBeInTheDocument()
  })

  it("applies the field variant shell by default", () => {
    const { container } = renderCombobox()
    const group = container.querySelector("[data-slot=input-group]")
    expect(group).toHaveAttribute("data-variant", "field")
    expect(group).toHaveClass("rounded-lg", "bg-brand-cream/60")
  })

  it("applies the pill variant shell when requested", () => {
    const { container } = renderCombobox({ variant: "pill" })
    const group = container.querySelector("[data-slot=input-group]")
    expect(group).toHaveAttribute("data-variant", "pill")
    expect(group).toHaveClass("rounded-full", "bg-transparent")
  })

  it("wires the pill variant so a chip can key its radius off the container", () => {
    // No stylesheet in jsdom, so assert the contract rather than the radius:
    // container publishes data-variant, chip carries the selector that reads it.
    const { container } = render(
      <Combobox defaultValue={["Apple"]} items={fruits} multiple>
        <ComboboxChips variant="pill">
          <ComboboxChip>Apple</ComboboxChip>
        </ComboboxChips>
      </Combobox>,
    )
    const chips = container.querySelector("[data-slot=combobox-chips]")
    expect(chips).toHaveAttribute("data-variant", "pill")
    expect(chips).toHaveClass("rounded-full", "bg-transparent")
    expect(
      container.querySelector("[data-slot=combobox-chip]")?.closest("[data-variant=pill]"),
    ).toBe(chips)
  })

  it("dresses the chips shell from the shared input-group variant", () => {
    // Guards against the shell forking its own field/pill mapping.
    const { container } = render(
      <Combobox defaultValue={["Apple"]} items={fruits} multiple>
        <ComboboxChips variant="field">
          <ComboboxChip>Apple</ComboboxChip>
        </ComboboxChips>
      </Combobox>,
    )
    expect(container.querySelector("[data-slot=combobox-chips]")).toHaveClass(
      "rounded-lg",
      "border-brand-border",
      "bg-brand-cream/60",
    )
  })

  it("keeps the trigger out of the tab order", async () => {
    renderCombobox()
    const trigger = await screen.findByRole("button", { name: "Open list" })
    expect(trigger).toHaveAttribute("data-slot", "combobox-trigger")
    expect(trigger).toHaveAttribute("tabindex", "-1")
  })

  it("gives the clear button an accessible name", () => {
    renderCombobox({ defaultValue: "Cherry", showClear: true })
    expect(screen.getByRole("button", { name: "Clear selection" })).toBeInTheDocument()
  })

  it("names the chip remove button after the chip it removes", () => {
    render(
      <Combobox defaultValue={["Apple"]} items={fruits} multiple>
        <ComboboxChips>
          <ComboboxChip>Apple</ComboboxChip>
        </ComboboxChips>
      </Combobox>,
    )
    expect(screen.getByRole("button", { name: "Remove Apple" })).toBeInTheDocument()
  })

  it("does not render the clear button while the value is empty", () => {
    const { container } = renderCombobox({ showClear: true })
    expect(container.querySelector("[data-slot=combobox-clear]")).not.toBeInTheDocument()
  })

  it("renders grouped items with a label and separator", async () => {
    const user = userEvent.setup()
    render(
      <Combobox items={fruits}>
        <ComboboxInput placeholder="Pick a grouped fruit..." />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxGroup className="fruit-group">
              <ComboboxLabel className="fruit-label">Fruit</ComboboxLabel>
              <ComboboxItem value="Apple">Apple</ComboboxItem>
            </ComboboxGroup>
            <ComboboxSeparator className="fruit-separator" />
          </ComboboxList>
        </ComboboxContent>
      </Combobox>,
    )

    await user.click(screen.getByRole("combobox"))

    expect(await screen.findByText("Fruit")).toHaveAttribute("data-slot", "combobox-label")
    expect(document.querySelector("[data-slot=combobox-group]")).toHaveClass("fruit-group")
    expect(document.querySelector("[data-slot=combobox-separator]")).toHaveClass("fruit-separator")
  })

  it("renders and updates the multiple-value controls", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Combobox defaultValue={["Apple"]} items={fruits} multiple>
        <ComboboxChips className="fruit-chips">
          <ComboboxValue>
            {(values: string[]) => (
              <>
                {values.map((value) => (
                  <ComboboxChip key={value}>{value}</ComboboxChip>
                ))}
                <ComboboxChipsInput className="fruit-input" placeholder="Pick fruits..." />
              </>
            )}
          </ComboboxValue>
          <ComboboxClear />
        </ComboboxChips>
      </Combobox>,
    )

    const chips = container.querySelector("[data-slot=combobox-chips]")
    expect(chips).toHaveAttribute("data-variant", "field")
    expect(chips).toHaveClass("fruit-chips", "rounded-lg", "bg-brand-cream/60")
    expect(screen.getByPlaceholderText("Pick fruits...")).toHaveClass("fruit-input")
    expect(container.querySelector("[data-slot=combobox-chip]")).toHaveTextContent("Apple")

    await user.click(container.querySelector("[data-slot=combobox-chip-remove]") as HTMLElement)
    expect(container.querySelector("[data-slot=combobox-chip]")).not.toBeInTheDocument()
  })

  it("accumulates chips as items are selected", async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <Combobox items={fruits} multiple onValueChange={onValueChange}>
        <ComboboxChips>
          <ComboboxValue>
            {(values: string[]) => (
              <>
                {values.map((value) => (
                  <ComboboxChip key={value}>{value}</ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder="Pick fruits..." />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent>
          <ComboboxList>
            <ComboboxCollection>
              {(fruit: string) => (
                <ComboboxItem key={fruit} value={fruit}>
                  {fruit}
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>,
    )

    const input = screen.getByPlaceholderText("Pick fruits...")
    await user.click(input)
    await user.click(await screen.findByRole("option", { name: "Apple" }))
    expect(container.querySelectorAll("[data-slot=combobox-chip]")).toHaveLength(1)

    await user.click(input)
    await user.click(await screen.findByRole("option", { name: "Cherry" }))
    expect(container.querySelectorAll("[data-slot=combobox-chip]")).toHaveLength(2)
    expect(onValueChange).toHaveBeenLastCalledWith(["Apple", "Cherry"], expect.anything())
  })

  it("can hide a chip remove control", () => {
    const { container } = render(
      <Combobox defaultValue={["Apple"]} items={fruits} multiple>
        <ComboboxChips>
          <ComboboxChip showRemove={false}>Apple</ComboboxChip>
        </ComboboxChips>
      </Combobox>,
    )

    expect(container.querySelector("[data-slot=combobox-chip]")).toHaveTextContent("Apple")
    expect(container.querySelector("[data-slot=combobox-chip-remove]")).not.toBeInTheDocument()
  })

  it("uses a generic remove label for non-text chip content", () => {
    render(
      <Combobox defaultValue={["Apple"]} items={fruits} multiple>
        <ComboboxChips>
          <ComboboxChip>
            <span>Apple</span>
          </ComboboxChip>
        </ComboboxChips>
      </Combobox>,
    )

    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument()
  })
})
