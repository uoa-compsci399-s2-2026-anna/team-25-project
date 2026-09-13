"use client"

import {
  ProposalEthicsStatus,
  ProposalEthicsStatusLabels,
  ProposalTimeframeStartPeriod,
  ProposalTimeframeStartPeriodLabels,
} from "@repo/shared/enums/proposals"
import { postProposalFormSchema } from "@repo/shared/schemas/proposals"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import {
  Button,
  DialogFooter,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
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
import { postProposal } from "../actions/postProposal"

const startPeriodOptions = toSelectOptions(ProposalTimeframeStartPeriodLabels)
const ethicsOptions = toSelectOptions(ProposalEthicsStatusLabels)

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
        startPeriod: ProposalTimeframeStartPeriod.SEM_1 as ProposalTimeframeStartPeriod,
      },
      ethics: ProposalEthicsStatus.UNKNOWN as ProposalEthicsStatus,
      summary: "",
      body: "",
    },
    validators: { onChange: postProposalFormSchema },
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
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <div className="grid gap-8 py-4 sm:grid-cols-2">
        <FieldGroup className="gap-5">
          <form.Field name="title">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                <FieldLabel htmlFor={field.name}>
                  <span>
                    Title <RequiredAsterisk />
                  </span>
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  value={field.state.value}
                />
                <FieldError errors={field.state.meta.errors} />
                {fieldErrors.title && <FieldError>{fieldErrors.title}</FieldError>}
              </Field>
            )}
          </form.Field>

          <form.Field name="outputTarget">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Output target</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="e.g. ACE 2027 paper"
                  value={field.state.value}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="timeframe.startYear">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                <FieldLabel htmlFor={field.name}>
                  <span>
                    Start year <RequiredAsterisk />
                  </span>
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(Number(event.target.value))}
                  type="number"
                  value={field.state.value}
                />
                <FieldError errors={field.state.meta.errors} />
                {fieldErrors["timeframe.startYear"] && (
                  <FieldError>{fieldErrors["timeframe.startYear"]}</FieldError>
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="timeframe.startPeriod">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
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
                  <SelectTrigger className="w-full" id={field.name}>
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
                <FieldError errors={field.state.meta.errors} />
                {fieldErrors["timeframe.startPeriod"] && (
                  <FieldError>{fieldErrors["timeframe.startPeriod"]}</FieldError>
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="ethics">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
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
                  <SelectTrigger className="w-full" id={field.name}>
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
                <FieldError errors={field.state.meta.errors} />
                {fieldErrors.ethics && <FieldError>{fieldErrors.ethics}</FieldError>}
              </Field>
            )}
          </form.Field>
        </FieldGroup>

        <FieldGroup>
          <form.Field name="summary">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                <FieldLabel htmlFor={field.name}>
                  <span>
                    Summary <RequiredAsterisk />
                  </span>
                </FieldLabel>
                <TextArea
                  className="min-h-40"
                  id={field.name}
                  maxLength={500}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  value={field.state.value}
                />
                <FieldError errors={field.state.meta.errors} />
                {fieldErrors.summary && <FieldError>{fieldErrors.summary}</FieldError>}
              </Field>
            )}
          </form.Field>

          <form.Field name="body">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                <FieldLabel htmlFor={field.name}>
                  <span>
                    Body <RequiredAsterisk />
                  </span>
                </FieldLabel>
                <TextArea
                  className="min-h-40"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  value={field.state.value}
                />
                <FieldError errors={field.state.meta.errors} />
                {fieldErrors.body && <FieldError>{fieldErrors.body}</FieldError>}
              </Field>
            )}
          </form.Field>
        </FieldGroup>
      </div>

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
