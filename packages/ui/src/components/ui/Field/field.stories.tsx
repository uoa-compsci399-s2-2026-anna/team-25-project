import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"
import { Input } from "../Input/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "./field"

const meta: Meta<typeof Field> = {
  title: "ui/Field",
  component: Field,
}

export default meta
type Story = StoryObj<typeof Field>

export const Primary: Story = {
  render: () => {
    const id = React.useId()
    return (
      <Field className="w-80">
        <FieldLabel htmlFor={id}>Email</FieldLabel>
        <Input id={id} placeholder="jane@example.com" type="email" />
        <FieldDescription>We'll only use this to contact you about your account.</FieldDescription>
      </Field>
    )
  },
}

export const Invalid: Story = {
  render: () => {
    const id = React.useId()
    return (
      <Field className="w-80" data-invalid>
        <FieldLabel htmlFor={id}>Username</FieldLabel>
        <Input aria-invalid id={id} placeholder="jane_doe" />
        <FieldError>Usernames can only contain letters, numbers, and underscores.</FieldError>
      </Field>
    )
  },
}

export const Horizontal: Story = {
  render: () => {
    const id = React.useId()
    return (
      <Field className="w-96" orientation="horizontal">
        <FieldLabel htmlFor={id}>Email</FieldLabel>
        <Input id={id} placeholder="jane@example.com" type="email" />
      </Field>
    )
  },
}

export const Group: Story = {
  render: () => {
    const firstNameId = React.useId()
    const lastNameId = React.useId()
    return (
      <FieldGroup className="w-80">
        <Field>
          <FieldLabel htmlFor={firstNameId}>First name</FieldLabel>
          <Input id={firstNameId} placeholder="Jane" />
        </Field>
        <Field>
          <FieldLabel htmlFor={lastNameId}>Last name</FieldLabel>
          <Input id={lastNameId} placeholder="Doe" />
        </Field>
      </FieldGroup>
    )
  },
}

export const WithFieldSet: Story = {
  render: () => {
    const displayNameId = React.useId()
    const handleId = React.useId()
    return (
      <FieldSet className="w-80">
        <FieldLegend>Profile</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={displayNameId}>Display name</FieldLabel>
            <Input id={displayNameId} placeholder="Jane Doe" />
          </Field>
          <FieldSeparator>or</FieldSeparator>
          <Field>
            <FieldLabel htmlFor={handleId}>Handle</FieldLabel>
            <Input id={handleId} placeholder="@janedoe" />
          </Field>
        </FieldGroup>
      </FieldSet>
    )
  },
}
