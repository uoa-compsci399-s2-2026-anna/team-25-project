"use client"

import { PublicationType, PublicationTypeLabels } from "@repo/shared/enums/publications"
import { addPublicationFormSchema } from "@repo/shared/schemas/publications"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import { validateField } from "@repo/shared/utils/validate-field"
import {
  Button,
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
import { type ComponentProps, type ReactNode, useState } from "react"
import { createPublication } from "../actions/createPublication"

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
const coAuthorNameSchema = formShape.coAuthors.element.shape.name

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
  /** The signed-in member's name, shown as the fixed first author. */
  defaultAuthorName: string
  onSuccess?: () => void
}

export const AddPublicationForm = ({ defaultAuthorName, onSuccess }: AddPublicationFormProps) => {
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const form = useForm({
    defaultValues: {
      type: PublicationType.ARTICLE as PublicationType,
      title: "",
      coAuthors: [] as { name: string }[],
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
    onSubmit: async ({ value, formApi }) => {
      setFieldErrors({})
      setFormError(undefined)

      try {
        const result = await createPublication(value)
        if (result.ok) {
          toast.add({ type: "success", title: "Publication added" })
          formApi.reset()
          onSuccess?.()
          return
        }

        setFieldErrors(result.fieldErrors ?? {})
        setFormError(result.formError)
      } catch {
        setFormError("Could not add this publication. Try again.")
      }
    },
  })

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
                    onValueChange={(value) => field.handleChange(value ?? PublicationType.ARTICLE)}
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

        <form.Field mode="array" name="coAuthors">
          {(coAuthorsField) => (
            <FieldSet className="gap-3">
              <FieldLegend variant="label">Authors</FieldLegend>
              <Input aria-label="Author 1 name" disabled value={defaultAuthorName} />
              {coAuthorsField.state.value.map((_, index) => (
                <form.Field
                  // biome-ignore lint/suspicious/noArrayIndexKey: TanStack array fields are addressed by index
                  key={index}
                  name={`coAuthors[${index}].name`}
                  validators={{ onBlur: validateField(coAuthorNameSchema) }}
                >
                  {(field) => {
                    const invalid = isInvalid(field)
                    const serverError = fieldErrors[`coAuthors.${index}.name`]
                    // The signed-in member is author 1, so co-authors start at 2.
                    const position = index + 2
                    return (
                      <Field data-invalid={invalid || undefined}>
                        <div className="flex items-center gap-3">
                          <Input
                            aria-invalid={invalid}
                            aria-label={`Author ${position} name`}
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            value={field.state.value}
                          />
                          <Button
                            aria-label={`Remove author ${position}`}
                            onClick={() => coAuthorsField.removeValue(index)}
                            size="sm"
                            type="button"
                            variant="button-transparent"
                          >
                            Remove
                          </Button>
                        </div>
                        {invalid && <FieldError errors={field.state.meta.errors} />}
                        {serverError && <FieldError>{serverError}</FieldError>}
                      </Field>
                    )
                  }}
                </form.Field>
              ))}
              {fieldErrors.authors && <FieldError>{fieldErrors.authors}</FieldError>}
              <div>
                <Button
                  onClick={() => coAuthorsField.pushValue({ name: "" })}
                  size="sm"
                  type="button"
                  variant="button-transparent"
                >
                  + Add author
                </Button>
              </div>
            </FieldSet>
          )}
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
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(Number(event.target.value))}
                    type="number"
                    value={field.state.value}
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
                      {(value: string | null) => (value ? MONTHS[Number(value) - 1] : "Not set")}
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
            <TextInputField field={field} label="Publisher" serverError={fieldErrors.publisher} />
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
