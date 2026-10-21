import type { DeepKeys, DeepValue } from "@tanstack/react-form"
import type { ComponentProps, ReactNode } from "react"
import { EditCheckboxList } from "./EditCheckboxList"
import { EditProvider } from "./EditContext"
import { EditInput, type EditInputValue } from "./EditInput"
import { EditNumberInput, type EditNumberInputValue } from "./EditNumberInput"
import { EditRichText, type EditRichTextValue } from "./EditRichText"
import { EditSelect } from "./EditSelect"
import { EditTabs } from "./EditTabs"
import { EditTagList, type EditTagListValue } from "./EditTagList"

/** The keys of T holding a File - its own keys (name, size...) are not form fields. */
type FileKeys<T> = {
  [K in DeepKeys<T>]: File extends DeepValue<T, K> ? K : never
}[DeepKeys<T>]

/** The form fields of T: every key, less list items and the insides of a File. */
type FieldKeys<T> = Exclude<
  DeepKeys<T>,
  `${string}[${number}]${string}` | `${FileKeys<T>}.${string}`
>

/** The fields of T that can hold any V, e.g. FieldsAccepting<Values, string> = "title" | ... */
export type FieldsAccepting<T, V> = {
  [K in FieldKeys<T>]: [V] extends [DeepValue<T, K>] ? K : never
}[FieldKeys<T>]

/** The fields of T whose values are all a kind of V, e.g. the enum fields for V = string. */
export type FieldsWithin<T, V> = {
  [K in FieldKeys<T>]: [NonNullable<DeepValue<T, K>>] extends [V] ? K : never
}[FieldKeys<T>]

/** The saved value for field K - Payload leaves optional fields null/undefined, so both pass. */
type SavedValue<T, K extends DeepKeys<T>> = DeepValue<T, K> | null | undefined

type Option<V> = { label: string; value: V }

/**
 * A free-entry control (props P) that writes a V, so `name` only takes a field that holds
 * any V. An empty control writes null/undefined, left for the schema to reject if required.
 */
export type TypedEdit<P extends { name: string }, T, V> = <
  K extends FieldsAccepting<T, NonNullable<V>>,
>(
  props: Omit<P, "name" | "value"> & { name: K } & ("value" extends keyof P
      ? { value: SavedValue<T, K> }
      : unknown),
) => ReactNode

/** A pick-from-options control: the options must be values field K can hold. */
type TypedPick<
  P extends { name: string; value: unknown; options: unknown },
  T,
  V,
  Element = false,
> = <K extends FieldsWithin<T, V>>(
  props: Omit<P, "name" | "value" | "options"> & {
    name: K
    options: Option<
      Element extends true
        ? NonNullable<DeepValue<T, K>> extends readonly (infer E)[]
          ? E
          : never
        : NonNullable<DeepValue<T, K>>
    >[]
    value: SavedValue<T, K>
  },
) => ReactNode

/** Select can also clear to null, so `nullLabel` is only offered where the field allows null. */
type TypedSelect<T> = <K extends FieldsWithin<T, string>>(
  props: Omit<ComponentProps<typeof EditSelect>, "name" | "value" | "options" | "nullLabel"> & {
    name: K
    options: Option<NonNullable<DeepValue<T, K>>>[]
    value: SavedValue<T, K>
  } & (null extends DeepValue<T, K> ? { nullLabel?: string } : { nullLabel?: never }),
) => ReactNode

type EditFields<T> = {
  /** The editor for these controls - its schema and onSave are typed to the same T. */
  Provider: (props: ComponentProps<typeof EditProvider<T & Record<string, unknown>>>) => ReactNode
  CheckboxList: TypedPick<ComponentProps<typeof EditCheckboxList>, T, string[], true>
  Input: TypedEdit<ComponentProps<typeof EditInput>, T, EditInputValue>
  NumberInput: TypedEdit<ComponentProps<typeof EditNumberInput>, T, EditNumberInputValue>
  RichText: TypedEdit<ComponentProps<typeof EditRichText>, T, EditRichTextValue>
  Select: TypedSelect<T>
  Tabs: TypedPick<ComponentProps<typeof EditTabs>, T, string>
  TagList: TypedEdit<ComponentProps<typeof EditTagList>, T, EditTagListValue>
}

/**
 * The editor and its controls, typed to one feature's values: a misspelt name, a field that
 * can't hold what the control writes, or a value or option of the wrong type fails to compile.
 * Kept out of "use client" so server components can use them.
 */
export const createEditFields = <T>() =>
  // Each type only narrows its control's own props, but TypeScript can't prove that for a
  // generic T - so the controls are cast once here.
  ({
    Provider: EditProvider,
    CheckboxList: EditCheckboxList,
    Input: EditInput,
    NumberInput: EditNumberInput,
    RichText: EditRichText,
    Select: EditSelect,
    Tabs: EditTabs,
    TagList: EditTagList,
  }) as unknown as EditFields<T>
