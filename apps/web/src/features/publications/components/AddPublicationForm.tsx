"use client"

import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { PublicationType, PublicationTypeLabels } from "@repo/shared/enums/publications"
import {
  type AddPublicationFormInput,
  addPublicationFormSchema,
  authorNameSchema,
  latestPublicationYear,
} from "@repo/shared/schemas/publications"
import type {
  BibtexImportResult,
  BibtexImportValues,
  PersonName,
} from "@repo/shared/utils/bibtex-import"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import { validateField } from "@repo/shared/utils/validate-field"
import {
  Button,
  Collapsible,
  CollapsiblePanel,
  DialogFooter,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextArea,
  toast,
} from "@repo/ui/components/ui"
import { type AnyFieldApi, useForm } from "@tanstack/react-form"
import { type ComponentProps, type ReactNode, useId, useState } from "react"
import type { ActionResult } from "@/features/auth/actions/types"
import { createPublication } from "../actions/createPublication"
import { BibtexImport } from "./BibtexImport"
import { SectionTrigger } from "./SectionTrigger"
import { SortableAuthorRow } from "./SortableAuthorRow"

const typeOptions = toSelectOptions(PublicationTypeLabels)

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]
const formShape = addPublicationFormSchema.shape

const CREATE_FAILED = "Could not add this publication. Try again."

// Server field errors that the form shows next to a field. Any other key (for
// example a Payload error on a field the form does not have) goes in the form error.
const isShownField = (key: string) => key in formShape || /^authors\.\d+\.name$/.test(key)

const splitServerErrors = (fieldErrors: Record<string, string> = {}) => {
  const shown: Record<string, string> = {}
  const other: string[] = []
  for (const [key, message] of Object.entries(fieldErrors)) {
    if (isShownField(key)) shown[key] = message
    else other.push(message)
  }
  return { shown, other }
}

// Server errors for authors are keyed by row index, so they point at the wrong
// row after a row moves or is removed.
const withoutAuthorErrors = (errors: Record<string, string>) =>
  Object.fromEntries(Object.entries(errors).filter(([key]) => !key.startsWith("authors.")))

const RequiredAsterisk = () => (
  <span aria-hidden="true" className="text-destructive">
    *
  </span>
)

const isInvalid = (field: AnyFieldApi) => field.state.meta.isTouched && !field.state.meta.isValid

type TextInputFieldProps = {
  field: AnyFieldApi
  label: ReactNode
  serverError?: string
} & Pick<ComponentProps<typeof Input>, "placeholder" | "type">

const TextInputField = ({ field, label, serverError, ...inputProps }: TextInputFieldProps) => {
  const invalid = isInvalid(field)
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        aria-invalid={invalid}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        value={field.state.value}
        {...inputProps}
      />
      {invalid && <FieldError errors={field.state.meta.errors} />}
      {serverError && <FieldError>{serverError}</FieldError>}
    </Field>
  )
}

type AddPublicationFormProps = {
  /** The signed-in member, shown on their own author row. */
  currentUser: PersonName
  onSuccess?: () => void
}

export const AddPublicationForm = ({ currentUser, onSuccess }: AddPublicationFormProps) => {
  const defaultAuthorName = `${currentUser.firstName} ${currentUser.lastName}`
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [manualOpen, setManualOpen] = useState(false)
  const [selfAuthorId] = useState(() => crypto.randomUUID())
  // Keeps the dnd-kit ARIA ids the same on the server and the client.
  const dndContextId = useId()
  const sensors = useSensors(
    // A small distance lets a click on the handle focus it without starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const form = useForm({
    defaultValues: {
      type: PublicationType.ARTICLE as PublicationType,
      title: "",
      authors: [{ id: selfAuthorId, kind: "self" }] as AddPublicationFormInput["authors"],
      year: new Date().getFullYear(),
      month: "",
      doi: "",
      url: "",
      venue: "",
      volume: "",
      issue: "",
      pages: "",
      publisher: "",
      citationKey: "",
      abstract: "",
      tags: "",
    },
    validators: { onSubmit: addPublicationFormSchema },
    // Errors show on the fields, so open the section that holds them.
    onSubmitInvalid: () => setManualOpen(true),
    onSubmit: async ({ value, formApi }) => {
      setFieldErrors({})
      setFormError(undefined)

      // Only the action call is in the try. An error after a successful save must
      // not tell the user to add the publication again.
      let result: ActionResult
      try {
        result = await createPublication(value)
      } catch (error) {
        console.error("createPublication failed", error)
        setFormError(CREATE_FAILED)
        return
      }

      if (result.ok) {
        toast.add({ type: "success", title: "Publication added" })
        formApi.reset()
        onSuccess?.()
        return
      }

      const { shown, other } = splitServerErrors(result.fieldErrors)
      setFieldErrors(shown)
      setFormError([result.formError, ...other].filter(Boolean).join(" ") || undefined)
      if (Object.keys(shown).length > 0) setManualOpen(true)
    },
  })

  const handleImport = ({ values, authors }: BibtexImportResult) => {
    // Clear server errors. They describe the values from before the import.
    setFieldErrors({})
    setFormError(undefined)
    setManualOpen(true)

    // Start from a blank form, so no field keeps a value from an earlier import.
    form.reset()
    const names = Object.keys(values) as (keyof BibtexImportValues)[]
    for (const name of names) {
      // setFieldValue marks the field as touched and runs its change validators.
      form.setFieldValue(name, values[name] as never)
    }
    if (authors) form.setFieldValue("authors", authors)

    // Most validated fields use onBlur, so run those too. Then a problem such as a bad
    // DOI shows on the field, the same as when the user types it.
    for (const name of names) void form.validateField(name, "blur")
    for (const [index, author] of (authors ?? []).entries()) {
      if (author.kind === "coAuthor") void form.validateField(`authors[${index}].name`, "blur")
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <FieldGroup className="gap-5 py-4">
        <BibtexImport onImport={handleImport} self={currentUser} />

        {/* Kept mounted while closed, so the fields keep their state and validators. */}
        <Collapsible onOpenChange={setManualOpen} open={manualOpen}>
          <SectionTrigger>Manual entry</SectionTrigger>
          {/* The padding stops the panel's overflow-hidden from clipping focus rings. */}
          <CollapsiblePanel className="-mx-1 px-1" keepMounted>
            <FieldGroup className="gap-5 pt-3 pb-1">
              <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
                <form.Field name="type" validators={{ onChange: validateField(formShape.type) }}>
                  {(field) => {
                    const invalid = isInvalid(field)
                    return (
                      <Field data-invalid={invalid || undefined}>
                        <FieldLabel htmlFor={field.name}>
                          <span>
                            Type <RequiredAsterisk />
                          </span>
                        </FieldLabel>
                        <Select
                          name={field.name}
                          onValueChange={(value) =>
                            field.handleChange(value ?? PublicationType.ARTICLE)
                          }
                          value={field.state.value}
                        >
                          <SelectTrigger aria-invalid={invalid} className="w-full" id={field.name}>
                            <SelectValue placeholder="Select a type">
                              {(value: PublicationType) => PublicationTypeLabels[value]}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {typeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {invalid && <FieldError errors={field.state.meta.errors} />}
                        {fieldErrors.type && <FieldError>{fieldErrors.type}</FieldError>}
                      </Field>
                    )
                  }}
                </form.Field>

                <form.Field name="title" validators={{ onBlur: validateField(formShape.title) }}>
                  {(field) => (
                    <TextInputField
                      field={field}
                      label={
                        <span>
                          Title <RequiredAsterisk />
                        </span>
                      }
                      serverError={fieldErrors.title}
                    />
                  )}
                </form.Field>
              </div>

              <form.Field mode="array" name="authors">
                {(authorsField) => {
                  const rows = authorsField.state.value
                  const indexOf = (id: UniqueIdentifier) => rows.findIndex((row) => row.id === id)
                  const describe = (id: UniqueIdentifier) => {
                    const index = indexOf(id)
                    const row = rows[index]
                    const name = row?.kind === "self" ? defaultAuthorName : row?.name
                    return `author ${index + 1}${name ? `, ${name}` : ""}`
                  }
                  const announcements: Announcements = {
                    onDragStart: ({ active }) => `Picked up ${describe(active.id)}.`,
                    onDragOver: ({ active, over }) =>
                      over
                        ? `${describe(active.id)} is over position ${indexOf(over.id) + 1}.`
                        : `${describe(active.id)} is no longer over a position.`,
                    onDragEnd: ({ active, over }) =>
                      over
                        ? `Moved ${describe(active.id)} to position ${indexOf(over.id) + 1}.`
                        : `Dropped ${describe(active.id)}.`,
                    onDragCancel: ({ active }) =>
                      `Cancelled. ${describe(active.id)} stays at position ${indexOf(active.id) + 1}.`,
                  }
                  const handleDragEnd = ({ active, over }: DragEndEvent) => {
                    if (!over || active.id === over.id) return
                    authorsField.moveValue(indexOf(active.id), indexOf(over.id))
                    setFieldErrors(withoutAuthorErrors)
                  }

                  return (
                    <FieldSet className="gap-3">
                      <FieldLegend variant="label">
                        Authors <RequiredAsterisk />
                      </FieldLegend>
                      <DndContext
                        accessibility={{ announcements }}
                        collisionDetection={closestCenter}
                        id={dndContextId}
                        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                        onDragEnd={handleDragEnd}
                        sensors={sensors}
                      >
                        <SortableContext
                          items={rows.map((row) => row.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="flex flex-col gap-3">
                            {rows.map((row, index) => {
                              const position = index + 1
                              const serverError = fieldErrors[`authors.${index}.name`]
                              return (
                                <SortableAuthorRow id={row.id} key={row.id} position={position}>
                                  {/* No Remove button: the schema needs the member exactly once. */}
                                  {row.kind === "self" ? (
                                    <Field>
                                      <Input
                                        aria-label={`Author ${position} name`}
                                        disabled
                                        value={defaultAuthorName}
                                      />
                                      {serverError && <FieldError>{serverError}</FieldError>}
                                    </Field>
                                  ) : (
                                    <form.Field
                                      name={`authors[${index}].name`}
                                      validators={{ onBlur: validateField(authorNameSchema) }}
                                    >
                                      {(field) => {
                                        const invalid = isInvalid(field)
                                        return (
                                          <Field data-invalid={invalid || undefined}>
                                            <div className="flex items-center gap-3">
                                              <Input
                                                aria-invalid={invalid}
                                                aria-label={`Author ${position} name`}
                                                id={field.name}
                                                name={field.name}
                                                onBlur={field.handleBlur}
                                                onChange={(event) =>
                                                  field.handleChange(event.target.value)
                                                }
                                                value={field.state.value}
                                              />
                                              <Button
                                                aria-label={`Remove author ${position}`}
                                                onClick={() => {
                                                  authorsField.removeValue(index)
                                                  setFieldErrors(withoutAuthorErrors)
                                                }}
                                                size="sm"
                                                type="button"
                                                variant="button-transparent"
                                              >
                                                Remove
                                              </Button>
                                            </div>
                                            {invalid && (
                                              <FieldError errors={field.state.meta.errors} />
                                            )}
                                            {serverError && <FieldError>{serverError}</FieldError>}
                                          </Field>
                                        )
                                      }}
                                    </form.Field>
                                  )}
                                </SortableAuthorRow>
                              )
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                      <FieldError errors={authorsField.state.meta.errors} />
                      {fieldErrors.authors && <FieldError>{fieldErrors.authors}</FieldError>}
                      <div>
                        <Button
                          onClick={() =>
                            authorsField.pushValue({
                              id: crypto.randomUUID(),
                              kind: "coAuthor",
                              name: "",
                            })
                          }
                          size="sm"
                          type="button"
                          variant="button-transparent"
                        >
                          + Add author
                        </Button>
                      </div>
                    </FieldSet>
                  )
                }}
              </form.Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <form.Field name="year" validators={{ onBlur: validateField(formShape.year) }}>
                  {(field) => {
                    const invalid = isInvalid(field)
                    return (
                      <Field data-invalid={invalid || undefined}>
                        <FieldLabel htmlFor={field.name}>
                          <span>
                            Year <RequiredAsterisk />
                          </span>
                        </FieldLabel>
                        <Input
                          aria-invalid={invalid}
                          id={field.name}
                          max={latestPublicationYear()}
                          name={field.name}
                          onBlur={field.handleBlur}
                          // An empty input gives NaN, so the schema says the year is required.
                          onChange={(event) => field.handleChange(event.target.valueAsNumber)}
                          type="number"
                          value={Number.isNaN(field.state.value) ? "" : field.state.value}
                        />
                        {invalid && <FieldError errors={field.state.meta.errors} />}
                        {fieldErrors.year && <FieldError>{fieldErrors.year}</FieldError>}
                      </Field>
                    )
                  }}
                </form.Field>

                <form.Field name="month">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Month</FieldLabel>
                      <Select
                        name={field.name}
                        onValueChange={(value) => field.handleChange(value ?? "")}
                        value={field.state.value || null}
                      >
                        <SelectTrigger className="w-full" id={field.name}>
                          <SelectValue placeholder="Not set">
                            {(value: string | null) =>
                              value ? MONTHS[Number(value) - 1] : "Not set"
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Not set</SelectItem>
                          {MONTHS.map((label, index) => (
                            <SelectItem key={label} value={String(index + 1)}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.month && <FieldError>{fieldErrors.month}</FieldError>}
                    </Field>
                  )}
                </form.Field>
              </div>

              <form.Field name="venue">
                {(field) => (
                  <TextInputField
                    field={field}
                    label="Venue"
                    placeholder="Journal, conference, school or repository"
                    serverError={fieldErrors.venue}
                  />
                )}
              </form.Field>

              <div className="grid gap-5 sm:grid-cols-3">
                <form.Field name="volume">
                  {(field) => (
                    <TextInputField field={field} label="Volume" serverError={fieldErrors.volume} />
                  )}
                </form.Field>
                <form.Field name="issue">
                  {(field) => (
                    <TextInputField field={field} label="Issue" serverError={fieldErrors.issue} />
                  )}
                </form.Field>
                <form.Field name="pages">
                  {(field) => (
                    <TextInputField
                      field={field}
                      label="Pages"
                      placeholder="e.g. 123-145"
                      serverError={fieldErrors.pages}
                    />
                  )}
                </form.Field>
              </div>

              <form.Field name="publisher">
                {(field) => (
                  <TextInputField
                    field={field}
                    label="Publisher"
                    serverError={fieldErrors.publisher}
                  />
                )}
              </form.Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <form.Field name="doi" validators={{ onBlur: validateField(formShape.doi) }}>
                  {(field) => (
                    <TextInputField
                      field={field}
                      label="DOI"
                      placeholder="e.g. 10.1145/3313831.3376518"
                      serverError={fieldErrors.doi}
                    />
                  )}
                </form.Field>
                <form.Field name="url" validators={{ onBlur: validateField(formShape.url) }}>
                  {(field) => (
                    <TextInputField
                      field={field}
                      label="URL"
                      placeholder="https://"
                      serverError={fieldErrors.url}
                      type="url"
                    />
                  )}
                </form.Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <form.Field name="citationKey">
                  {(field) => (
                    <TextInputField
                      field={field}
                      label="Citation key"
                      placeholder="e.g. smith2024learning"
                      serverError={fieldErrors.citationKey}
                    />
                  )}
                </form.Field>
                <form.Field name="tags">
                  {(field) => (
                    <TextInputField
                      field={field}
                      label="Tags"
                      placeholder="Comma-separated, e.g. Assessment, Teamwork"
                      serverError={fieldErrors.tags}
                    />
                  )}
                </form.Field>
              </div>

              <form.Field name="abstract">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Abstract</FieldLabel>
                    <TextArea
                      className="min-h-32"
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                    {fieldErrors.abstract && <FieldError>{fieldErrors.abstract}</FieldError>}
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </CollapsiblePanel>
        </Collapsible>
      </FieldGroup>

      {formError && <FieldError className="mb-4">{formError}</FieldError>}

      <DialogFooter>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button disabled={isSubmitting} type="submit" variant="button-mauve">
              {isSubmitting ? "Adding..." : "Add publication"}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  )
}
