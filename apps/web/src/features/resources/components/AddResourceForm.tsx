"use client"

import {
  RESOURCE_ATTACHMENT_MIME_TYPES,
  RESOURCE_ATTACHMENTS_MAX_FILES,
  RESOURCE_ATTACHMENTS_MAX_MB,
} from "@repo/shared/constants/resource-attachments"
import { addResourceFormSchema, resourceAttachmentsError } from "@repo/shared/schemas/resources"
import { validateField } from "@repo/shared/utils/validate-field"
import { AttachmentPicker, RichTextEditor, type RichTextValue } from "@repo/ui/components/composite"
import {
  Button,
  DialogFooter,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@repo/ui/components/ui"
import { useForm } from "@tanstack/react-form"
import { useId, useState } from "react"
import { createResource } from "../actions/createResource"
import type { ResourceCourseOption } from "../resources.queries"

const formShape = addResourceFormSchema.shape

// Form value before the first edit. It matches richTextSchema but has no text, so validation
// gives only "Description is required".
const emptyDescription: RichTextValue = {
  root: { type: "root", children: [], direction: null, format: "", indent: 0, version: 1 },
}

const RequiredAsterisk = () => (
  <span aria-hidden="true" className="text-destructive">
    *
  </span>
)

type AddResourceFormProps = {
  /** The courses the member can link to: the ones they own or edit. */
  courses: ResourceCourseOption[]
  onSuccess?: () => void
}

export const AddResourceForm = ({ courses, onSuccess }: AddResourceFormProps) => {
  const attachmentsId = useId()
  const [attachments, setAttachments] = useState<File[]>([])
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const form = useForm({
    defaultValues: {
      title: "",
      course: null as number | null,
      description: emptyDescription,
    },
    validators: { onSubmit: addResourceFormSchema },
    onSubmit: async ({ value, formApi }) => {
      setFieldErrors({})
      setFormError(undefined)

      // Checked here too so too-large or unsupported files get a message without being sent.
      const attachmentsError = resourceAttachmentsError(attachments)
      if (attachmentsError) {
        setFieldErrors({ attachments: attachmentsError })
        return
      }

      const formData = new FormData()
      formData.set("title", value.title)
      formData.set("course", value.course === null ? "" : String(value.course))
      formData.set("description", JSON.stringify(value.description))
      for (const file of attachments) formData.append("attachments", file)

      try {
        const result = await createResource(formData)
        if (result.ok) {
          toast.add({ type: "success", title: "Resource shared" })
          formApi.reset()
          setAttachments([])
          onSuccess?.()
          return
        }

        setFieldErrors(result.fieldErrors ?? {})
        setFormError(result.formError)
      } catch {
        setFormError("Could not share this resource. Try again.")
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
        <form.Field name="title" validators={{ onBlur: validateField(formShape.title) }}>
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid || undefined}>
                <FieldLabel htmlFor={field.name}>
                  <span>
                    Title <RequiredAsterisk />
                  </span>
                </FieldLabel>
                <Input
                  aria-invalid={isInvalid}
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="e.g. Individual contribution rubric"
                  value={field.state.value}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                {fieldErrors.title && <FieldError>{fieldErrors.title}</FieldError>}
              </Field>
            )
          }}
        </form.Field>

        <form.Field name="course">
          {(field) => (
            <Field data-invalid={Boolean(fieldErrors.course) || undefined}>
              <FieldLabel htmlFor={field.name}>Course</FieldLabel>
              <Select
                disabled={courses.length === 0}
                items={courses}
                name={field.name}
                onValueChange={(value) => field.handleChange(value ?? null)}
                value={field.state.value}
              >
                <SelectTrigger
                  aria-invalid={Boolean(fieldErrors.course)}
                  className="w-full"
                  id={field.name}
                >
                  <SelectValue placeholder="No course" />
                </SelectTrigger>
                {/* Opens below the trigger, as the filter bar's selects do, rather than over it. */}
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value={null}>No course</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.value} value={course.value}>
                      {course.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {courses.length > 0
                  ? "Optional. Only courses you own or edit are listed."
                  : "You can link a course once you own or edit one."}
              </FieldDescription>
              {fieldErrors.course && <FieldError>{fieldErrors.course}</FieldError>}
            </Field>
          )}
        </form.Field>

        {/* No field-level check: "required" is its only rule, left to the submit-time schema.
            A failing field check would stop TanStack Form running that schema at all, hiding
            every other field's "required" message. */}
        <form.Field name="description">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid || undefined}>
                <FieldLabel htmlFor={field.name} id={`${field.name}-label`}>
                  <span>
                    Description <RequiredAsterisk />
                  </span>
                </FieldLabel>
                <RichTextEditor
                  aria-invalid={isInvalid}
                  aria-labelledby={`${field.name}-label`}
                  className="[&_[contenteditable]]:min-h-48"
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                {fieldErrors.description && <FieldError>{fieldErrors.description}</FieldError>}
              </Field>
            )
          }}
        </form.Field>

        <Field data-invalid={Boolean(fieldErrors.attachments) || undefined}>
          <FieldLabel htmlFor={attachmentsId}>Attachments</FieldLabel>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <AttachmentPicker
                accept={RESOURCE_ATTACHMENT_MIME_TYPES.join(",")}
                disabled={isSubmitting}
                files={attachments}
                id={attachmentsId}
                invalid={Boolean(fieldErrors.attachments)}
                onFilesChange={(files) => {
                  setAttachments(files)
                  setFieldErrors(({ attachments: _, ...rest }) => rest)
                }}
              />
            )}
          </form.Subscribe>
          <FieldDescription>
            PDF, Word, PowerPoint, Excel, text or CSV. Up to {RESOURCE_ATTACHMENTS_MAX_FILES} files,{" "}
            {RESOURCE_ATTACHMENTS_MAX_MB} MB in total.
          </FieldDescription>
          {fieldErrors.attachments && <FieldError>{fieldErrors.attachments}</FieldError>}
        </Field>
      </FieldGroup>

      {formError && <FieldError className="mb-4">{formError}</FieldError>}

      <DialogFooter>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button disabled={isSubmitting} type="submit" variant="button-mauve">
              {isSubmitting ? "Sharing..." : "Share resource"}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  )
}
