import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"
import { Button } from "../Button/button"
import { Field, FieldGroup, FieldLabel } from "../Field/field"
import { Input } from "../Input/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"

// TODO: swap for the real TextArea component (packages/ui/src/components/ui/TextArea)
// once this branch is rebased onto main — it merged there after this branch was cut,
// so it isn't available here yet. Story-only, not used by dialog.tsx itself.
// Note in the PR description that this story ships with the ad-hoc textarea below.
const textareaClassName =
  "min-h-32 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground placeholder:italic focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

// Button has no destructive variant, so this matches Badge's destructive treatment
// (bg-destructive/10 text-destructive) layered onto the unstyled base instead.
const destructiveButtonClassName = "bg-destructive/10 text-destructive hover:bg-destructive/20"

const meta: Meta<typeof Dialog> = {
  title: "ui/Dialog",
  component: Dialog,
}

export default meta
type Story = StoryObj<typeof Dialog>

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Edit profile</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update your name and email, then save changes.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button borderColor="charcoal" variant="button-transparent" />}>
            Cancel
          </DialogClose>
          <Button>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const Destructive: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger
        render={
          <Button className={destructiveButtonClassName} variant="button-unstyled">
            Delete project
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            This will permanently delete the project and all of its data. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button borderColor="charcoal" variant="button-transparent" />}>
            Cancel
          </DialogClose>
          <Button className={destructiveButtonClassName} variant="button-unstyled">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const WithoutCloseButton: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger
        render={
          <Button borderColor="charcoal" variant="button-transparent">
            Open dialog
          </Button>
        }
      />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>No dismiss icon</DialogTitle>
          <DialogDescription>
            Use the footer action to close instead of the corner icon.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />}>Got it</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const NoFooter: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger
        render={
          <Button borderColor="charcoal" variant="button-transparent">
            View details
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment received</DialogTitle>
          <DialogDescription>
            $240.00 was received from Acme Inc. on 4 September 2026.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
}

export const Larger: Story = {
  render: () => {
    const emailId = React.useId()
    const roleId = React.useId()
    return (
      <Dialog>
        <DialogTrigger
          render={
            <Button borderColor="charcoal" variant="button-transparent">
              Invite teammate
            </Button>
          }
        />
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite a teammate</DialogTitle>
            <DialogDescription>
              Send an invite so they can join this workspace. You can change their role at any time
              from the members list.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={emailId}>Email address</FieldLabel>
              <Input id={emailId} placeholder="jane@example.com" type="email" />
            </Field>
            <Field>
              <FieldLabel htmlFor={roleId}>Role</FieldLabel>
              <Input id={roleId} placeholder="Member" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button borderColor="charcoal" variant="button-transparent" />}>
              Cancel
            </DialogClose>
            <Button>Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
}

// Layout reference: a two-column form dialog with a title-row close action instead
// of the corner icon, matching the "Add a capstone course" mock. Built from Dialog +
// Field + Input directly — not the AddCapstoneCourseDialog composite, which is tracked
// separately.
export const LargeForm: Story = {
  render: () => {
    const courseCodeId = React.useId()
    const courseNameId = React.useId()
    const courseProgramId = React.useId()
    const deliveryFormatId = React.useId()
    const projectTypeId = React.useId()
    const learningOutcomesId = React.useId()
    const assessmentsId = React.useId()
    return (
      <Dialog>
        <DialogTrigger
          render={
            <Button borderColor="charcoal" variant="button-transparent">
              Add a capstone course
            </Button>
          }
        />
        <DialogContent className="sm:max-w-3xl" showCloseButton={false}>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="font-bold text-2xl">Add a capstone course</DialogTitle>
            <DialogClose render={<Button size="sm" variant="button-transparent" />}>
              Cancel
            </DialogClose>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={courseCodeId}>Course code</FieldLabel>
                <Input id={courseCodeId} placeholder="e.g. CS399" />
              </Field>
              <Field>
                <FieldLabel htmlFor={courseNameId}>Course name</FieldLabel>
                <Input id={courseNameId} />
              </Field>
              <Field>
                <FieldLabel htmlFor={courseProgramId}>Course program</FieldLabel>
                <Input id={courseProgramId} />
              </Field>
              <Field>
                <FieldLabel htmlFor={deliveryFormatId}>Delivery format</FieldLabel>
                <Input id={deliveryFormatId} />
              </Field>
              <Field>
                <FieldLabel htmlFor={projectTypeId}>Project type</FieldLabel>
                <Input id={projectTypeId} />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={learningOutcomesId}>Learning outcomes</FieldLabel>
                <textarea className={textareaClassName} id={learningOutcomesId} />
              </Field>
              <Field>
                <FieldLabel htmlFor={assessmentsId}>Assessments</FieldLabel>
                <textarea className={textareaClassName} id={assessmentsId} />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button borderColor="charcoal" variant="button-transparent">
              Save draft
            </Button>
            <Button>Publish proposal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
}
