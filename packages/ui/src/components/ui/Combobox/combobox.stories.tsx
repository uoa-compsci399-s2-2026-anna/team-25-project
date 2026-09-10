import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { type ComponentProps, useRef } from "react"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxClear,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "./combobox"

const fruits = ["Apple", "Banana", "Blueberry", "Cherry", "Grape", "Mango", "Peach"]

const variants = ["pill", "box"] as const

type StoryArgs = ComponentProps<typeof Combobox> & {
  variant?: (typeof variants)[number]
}

const meta: Meta<typeof Combobox> = {
  title: "ui/Forms/Combobox",
  component: Combobox,
  args: {
    items: fruits,
    // @ts-expect-error variant is a story-only control, forwarded to ComboboxInput
    variant: "box",
  },
  argTypes: {
    // @ts-expect-error variant is a story-only control, forwarded to ComboboxInput
    variant: {
      control: { type: "select" },
      options: variants,
    },
  },
}

export default meta
type Story = StoryFn<StoryArgs>

function FruitList({ anchor }: { anchor?: ComponentProps<typeof ComboboxContent>["anchor"] }) {
  return (
    <ComboboxContent anchor={anchor}>
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
  )
}

export const Default: Story = ({ variant, ...args }) => (
  <Combobox {...args}>
    <ComboboxInput placeholder="Pick a fruit..." variant={variant} />
    <FruitList />
  </Combobox>
)

export const Clearable: Story = ({ variant, ...args }) => (
  <Combobox {...args} defaultValue="Cherry">
    <ComboboxInput placeholder="Pick a fruit..." showClear variant={variant} />
    <FruitList />
  </Combobox>
)

export const Filter: Story = ({ variant, ...args }) => (
  <Combobox {...args}>
    <ComboboxInput className="w-fit" placeholder="University" variant={variant} />
    <FruitList />
  </Combobox>
)
Filter.args = { variant: "pill" }

export const Disabled: Story = ({ variant, ...args }) => (
  <Combobox {...args} disabled>
    <ComboboxInput placeholder="Pick a fruit..." variant={variant} />
  </Combobox>
)

export const Multiple: Story = ({ variant, ...args }) => {
  // Anchor the popup to the chips shell, not to the input that trails the chips,
  // so the list stays flush with the left edge however many chips are selected.
  const anchor = useRef<HTMLDivElement | null>(null)

  return (
    <Combobox defaultValue={["Apple", "Mango"]} items={args.items} multiple>
      <ComboboxChips ref={anchor} variant={variant}>
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
        <ComboboxClear />
      </ComboboxChips>
      <FruitList anchor={anchor} />
    </Combobox>
  )
}
