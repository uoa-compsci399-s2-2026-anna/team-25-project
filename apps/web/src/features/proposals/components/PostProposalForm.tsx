"use client"

import {
  ProposalEthicsStatus,
  ProposalEthicsStatusLabels,
  type ProposalTag,
  ProposalTagLabels,
  type ProposalTimeframeEndPeriod,
  ProposalTimeframeEndPeriodLabels,
  ProposalTimeframeStartPeriod,
  ProposalTimeframeStartPeriodLabels,
} from "@repo/shared/enums/proposals"
import { postProposalFormSchema } from "@repo/shared/schemas/proposals"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import { validateField } from "@repo/shared/utils/validate-field"
import { RichTextEditor, type RichTextValue } from "@repo/ui/components/composite"
import {
  Button,
  Checkbox,
  DialogFooter,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextArea,
  toast,
} from "@repo/ui/components/ui"
import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import type { z } from "zod"
import { postProposal } from "../actions/postProposal"

const startPeriodOptions = toSelectOptions(ProposalTimeframeStartPeriodLabels)
const endPeriodOptions = toSelectOptions(ProposalTimeframeEndPeriodLabels)
const ethicsOptions = toSelectOptions(ProposalEthicsStatusLabels)
const tagOptions = toSelectOptions(ProposalTagLabels)

type PostProposalFormInput = z.input<typeof postProposalFormSchema>

const formShape = postProposalFormSchema.shape
const timeframeShape = formShape.timeframe.shape

// Form value before the first edit. It matches richTextSchema but has no text, so validation
// gives only "Body is required".
const emptyBody: RichTextValue = {
  root: { type: "root", children: [], direction: null, format: "", indent: 0, version: 1 },
}

const RequiredAsterisk = () => (
  <span aria-hidden="true" className="text-destructive">
    *
  </span>
)

type PostProposalFormProps = {
  onSuccess?: () => void
}

export const PostProposalForm = ({ onSuccess }: PostProposalFormProps) => {
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const form = useForm({
    defaultValues: {
      title: "",
      outputTarget: "",
      timeframe: {
        startYear: new Date().getFullYear(),
        startPeriod: ProposalTimeframeStartPeriod.SEM_1,
        endPeriod: null,
      } as PostProposalFormInput["timeframe"],
      ethics: ProposalEthicsStatus.UNKNOWN as ProposalEthicsStatus,
      tags: [] as ProposalTag[],
      summary: "",
      body: emptyBody,
    },
    validators: { onSubmit: postProposalFormSchema },
    onSubmit: async ({ value, formApi }) => {
      setFieldErrors({})
      setFormError(undefined)

      try {
        const result = await postProposal(value)
        if (result.ok) {
          toast.add({ type: "success", title: "Proposal posted" })
          formApi.reset()
          onSuccess?.()
          return
        }

        setFieldErrors(result.fieldErrors ?? {})
        setFormError(result.formError)
      } catch {
        setFormError("Could not post your proposal. Try again.")
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
                  value={field.state.value}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                {fieldErrors.title && <FieldError>{fieldErrors.title}</FieldError>}
              </Field>
            )
          }}
        </form.Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <form.Field
            name="timeframe.startPeriod"
            validators={{ onChange: validateField(timeframeShape.startPeriod) }}
          >
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid || undefined}>
                  <FieldLabel htmlFor={field.name}>
                    <span>
                      Start period <RequiredAsterisk />
                    </span>
                  </FieldLabel>
                  <Select
                    name={field.name}
                    onValueChange={(value) =>
                      field.handleChange(value ?? ProposalTimeframeStartPeriod.SEM_1)
                    }
                    value={field.state.value}
                  >
                    <SelectTrigger aria-invalid={isInvalid} className="w-full" id={field.name}>
                      <SelectValue placeholder="Select a period">
                        {(value: ProposalTimeframeStartPeriod) =>
                          ProposalTimeframeStartPeriodLabels[value]
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {startPeriodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  {fieldErrors["timeframe.startPeriod"] && (
                    <FieldError>{fieldErrors["timeframe.startPeriod"]}</FieldError>
                  )}
                </Field>
              )
            }}
          </form.Field>

          <form.Field
            name="timeframe.startYear"
            validators={{ onBlur: validateField(timeframeShape.startYear) }}
          >
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid || undefined}>
                  <FieldLabel htmlFor={field.name}>
                    <span>
                      Start year <RequiredAsterisk />
                    </span>
                  </FieldLabel>
                  <Input
                    aria-invalid={isInvalid}
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(Number(event.target.value))}
                    type="number"
                    value={field.state.value}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  {fieldErrors["timeframe.startYear"] && (
                    <FieldError>{fieldErrors["timeframe.startYear"]}</FieldError>
                  )}
                </Field>
              )
            }}
          </form.Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <form.Field
            name="timeframe.endPeriod"
            validators={{ onChange: validateField(timeframeShape.endPeriod) }}
          >
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid || undefined}>
                  <FieldLabel htmlFor={field.name}>End period</FieldLabel>
                  <Select
                    name={field.name}
                    onValueChange={(value) => field.handleChange(value)}
                    value={field.state.value}
                  >
                    <SelectTrigger aria-invalid={isInvalid} className="w-full" id={field.name}>
                      <SelectValue placeholder="None">
                        {(value: ProposalTimeframeEndPeriod | null) =>
                          value ? ProposalTimeframeEndPeriodLabels[value] : "None"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {endPeriodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  {fieldErrors["timeframe.endPeriod"] && (
                    <FieldError>{fieldErrors["timeframe.endPeriod"]}</FieldError>
                  )}
                </Field>
              )
            }}
          </form.Field>

          <form.Field
            name="timeframe.endYear"
            validators={{ onBlur: validateField(timeframeShape.endYear) }}
          >
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid || undefined}>
                  <FieldLabel htmlFor={field.name}>End year</FieldLabel>
                  <Input
                    aria-invalid={isInvalid}
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(
                        event.target.value === "" ? undefined : Number(event.target.value),
                      )
                    }
                    type="number"
                    value={field.state.value ?? ""}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  {fieldErrors["timeframe.endYear"] && (
                    <FieldError>{fieldErrors["timeframe.endYear"]}</FieldError>
                  )}
                </Field>
              )
            }}
          </form.Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <form.Field
            name="outputTarget"
            validators={{ onBlur: validateField(formShape.outputTarget) }}
          >
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid || undefined}>
                  <FieldLabel htmlFor={field.name}>Output target</FieldLabel>
                  <Input
                    aria-invalid={isInvalid}
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="e.g. ACE 2027 paper"
                    value={field.state.value}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="ethics" validators={{ onChange: validateField(formShape.ethics) }}>
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid || undefined}>
                  <FieldLabel htmlFor={field.name}>
                    <span>
                      Ethics status <RequiredAsterisk />
                    </span>
                  </FieldLabel>
                  <Select
                    name={field.name}
                    onValueChange={(value) =>
                      field.handleChange(value ?? ProposalEthicsStatus.UNKNOWN)
                    }
                    value={field.state.value}
                  >
                    <SelectTrigger aria-invalid={isInvalid} className="w-full" id={field.name}>
                      <SelectValue placeholder="Select a status">
                        {(value: ProposalEthicsStatus) => ProposalEthicsStatusLabels[value]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ethicsOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  {fieldErrors.ethics && <FieldError>{fieldErrors.ethics}</FieldError>}
                </Field>
              )
            }}
          </form.Field>
        </div>

        <form.Field name="tags">
          {(field) => (
            <FieldSet>
              <FieldLegend variant="label">Tags</FieldLegend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {tagOptions.map((option) => (
                  <div className="flex items-center gap-2" key={option.value}>
                    <Checkbox
                      checked={field.state.value.includes(option.value)}
                      id={`${field.name}-${option.value}`}
                      onCheckedChange={(checked) =>
                        field.handleChange(
                          tagOptions
                            .map((o) => o.value)
                            .filter((v) =>
                              v === option.value ? checked : field.state.value.includes(v),
                            ),
                        )
                      }
                    />
                    <Label className="font-normal" htmlFor={`${field.name}-${option.value}`}>
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
              {fieldErrors.tags && <FieldError>{fieldErrors.tags}</FieldError>}
            </FieldSet>
          )}
        </form.Field>

        <form.Field name="summary" validators={{ onBlur: validateField(formShape.summary) }}>
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid || undefined}>
                <FieldLabel htmlFor={field.name}>
                  <span>
                    Summary <RequiredAsterisk />
                  </span>
                </FieldLabel>
                <TextArea
                  aria-invalid={isInvalid}
                  className="min-h-20"
                  id={field.name}
                  maxLength={500}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  value={field.state.value}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                {fieldErrors.summary && <FieldError>{fieldErrors.summary}</FieldError>}
              </Field>
            )
          }}
        </form.Field>

        {/* No field validator: an empty body is still an object, so validateField would flag it
            and a failing field stops the form-level schema, hiding the other required errors. */}
        <form.Field name="body">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid || undefined}>
                <FieldLabel htmlFor={field.name} id={`${field.name}-label`}>
                  <span>
                    Body <RequiredAsterisk />
                  </span>
                </FieldLabel>
                <RichTextEditor
                  aria-invalid={isInvalid}
                  aria-labelledby={`${field.name}-label`}
                  className="[&_[contenteditable]]:min-h-72"
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                {fieldErrors.body && <FieldError>{fieldErrors.body}</FieldError>}
              </Field>
            )
          }}
        </form.Field>
      </FieldGroup>

      {formError && <FieldError className="mb-4">{formError}</FieldError>}

      <DialogFooter>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button disabled={isSubmitting} type="submit" variant="button-mauve">
              {isSubmitting ? "Publishing..." : "Publish proposal"}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  )
}
