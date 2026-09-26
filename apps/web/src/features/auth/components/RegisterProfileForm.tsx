"use client"

import { ALLOWED_AVATAR_MIME_TYPES, registerProfileSchema } from "@repo/shared/schemas/register"
import { AvatarUpload } from "@repo/ui/components/composite"
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  Input,
  Separator,
  Skeleton,
  TextArea,
} from "@repo/ui/components/ui"
import { useForm } from "@tanstack/react-form"
import { Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Routes } from "@/lib/routes"
import { completeProfile } from "../actions/register"

// Matches next.config.ts's serverActions.bodySizeLimit - checked here too so a
// large photo gets a clear message instead of the request failing silently.
const MAX_AVATAR_BYTES = 4 * 1024 * 1024

// Matches registerProfileSchema's links.max.
const MAX_LINKS = 5

export const RegisterProfileForm = ({ initials }: { initials: string }) => {
  const router = useRouter()
  const [avatar, setAvatar] = useState<File | undefined>(undefined)
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const form = useForm({
    defaultValues: {
      bio: "",
      links: [] as { label: string; url: string }[],
      researchInterests: "",
    },
    onSubmit: async ({ value }) => {
      setFieldErrors({})
      setFormError(undefined)

      if (avatar && avatar.size > MAX_AVATAR_BYTES) {
        setFormError("Your photo must be 4 MB or smaller.")
        return
      }

      const formData = new FormData()
      formData.set("bio", value.bio)
      formData.set("researchInterests", value.researchInterests)
      formData.set("links", JSON.stringify(value.links))
      if (avatar) formData.set("avatar", avatar)

      try {
        const result = await completeProfile(formData)

        if (result.ok) {
          router.push(Routes.HOME)
          return
        }

        setFieldErrors(result.fieldErrors ?? {})
        setFormError(result.formError)
      } catch {
        setFormError("Could not save your profile. Try again.")
      }
    },
    validators: { onSubmit: registerProfileSchema },
  })

  return (
    <form
      className="flex flex-col gap-8"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <AvatarUpload
          accept={ALLOWED_AVATAR_MIME_TYPES.join(",")}
          fallback={initials}
          onFileSelect={setAvatar}
          size="xl"
        />
        <p className="font-medium text-sm">Photo</p>
        <p className="text-muted-foreground text-xs">
          {avatar ? avatar.name : "Optional - you can add one later"}
        </p>
      </div>

      <FieldGroup>
        <form.Field name="bio">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
              <FieldLabel htmlFor={field.name}>About you</FieldLabel>
              <TextArea
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="A sentence or two on what you teach and what you're researching"
                value={field.state.value}
              />
              <FieldDescription>This is what other members see in the directory.</FieldDescription>
              <FieldError errors={field.state.meta.errors} />
              {fieldErrors.bio && <FieldError>{fieldErrors.bio}</FieldError>}
            </Field>
          )}
        </form.Field>

        <form.Field name="researchInterests">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
              <FieldLabel htmlFor={field.name}>Research interests</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Code review, Generative AI, Assessment"
                value={field.state.value}
              />
              <FieldDescription>Separate each interest with a comma.</FieldDescription>
              <FieldError errors={field.state.meta.errors} />
              {fieldErrors.researchInterests && (
                <FieldError>{fieldErrors.researchInterests}</FieldError>
              )}
            </Field>
          )}
        </form.Field>

        <form.Field mode="array" name="links">
          {(linksField) => (
            <FieldSet className="gap-3">
              <FieldLegend className="mb-0" variant="label">
                Links
              </FieldLegend>
              <FieldDescription>
                Your university profile, ORCID, GitHub or website.
              </FieldDescription>
              {linksField.state.value.map((_, index) => (
                // Rows have no stable id of their own; index keys match TanStack Form's array paths.
                // biome-ignore lint/suspicious/noArrayIndexKey: see above
                <div className="flex items-start gap-2" key={index}>
                  <form.Field name={`links[${index}].label`}>
                    {(field) => (
                      <Field
                        className="w-2/5"
                        data-invalid={field.state.meta.errors.length > 0 || undefined}
                      >
                        <Input
                          aria-label={`Link ${index + 1} label`}
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="GitHub"
                          value={field.state.value}
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name={`links[${index}].url`}>
                    {(field) => (
                      <Field
                        className="flex-1"
                        data-invalid={field.state.meta.errors.length > 0 || undefined}
                      >
                        <Input
                          aria-label={`Link ${index + 1} address`}
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="https://github.com/your-name"
                          type="url"
                          value={field.state.value}
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    )}
                  </form.Field>
                  <Button
                    aria-label={`Remove link ${index + 1}`}
                    onClick={() => linksField.removeValue(index)}
                    size="icon"
                    type="button"
                    variant="button-transparent"
                  >
                    <X />
                  </Button>
                </div>
              ))}
              {linksField.state.value.length < MAX_LINKS && (
                <Button
                  className="self-start"
                  onClick={() => linksField.pushValue({ label: "", url: "" })}
                  type="button"
                  variant="button-cream"
                >
                  <Plus />
                  Add link
                </Button>
              )}
              {fieldErrors.links && <FieldError>{fieldErrors.links}</FieldError>}
            </FieldSet>
          )}
        </form.Field>
      </FieldGroup>

      <Separator />

      {formError && <FieldError>{formError}</FieldError>}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-48 text-muted-foreground text-sm">
          You can finish this later from your profile.
        </p>
        <Button size="lg" type="submit" variant="button-mauve">
          Finish & enter CCCA
        </Button>
      </div>
    </form>
  )
}

/**
 * Same approach as RegisterDetailsSkeleton: real Field primitives with
 * invisible text, so the reserved height matches RegisterProfileForm exactly
 * rather than approximately. Controls here are the default h-8 / min-h-16,
 * not the h-10 the details step overrides to.
 */
export const RegisterProfileSkeleton = () => (
  <div className="flex flex-col gap-8">
    <div className="flex flex-col items-center gap-2">
      <Skeleton className="size-24 rounded-full" />
      <p className="invisible font-medium text-sm">Photo</p>
      <p className="invisible text-xs">Optional - you can add one later</p>
    </div>

    <FieldGroup>
      <Field>
        <FieldLabel className="invisible" htmlFor="skeleton">
          About you
        </FieldLabel>
        <Skeleton className="h-16 w-full rounded-md" />
        <FieldDescription className="invisible">
          This is what other members see in the directory.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel className="invisible" htmlFor="skeleton">
          Research interests
        </FieldLabel>
        <Skeleton className="h-8 w-full rounded-md" />
        <FieldDescription className="invisible">
          Separate each interest with a comma.
        </FieldDescription>
      </Field>
      <Field>
        <FieldTitle className="invisible">Links</FieldTitle>
        <FieldDescription className="invisible">
          Your university profile, ORCID, GitHub or website.
        </FieldDescription>
        <Skeleton className="h-7 w-24 rounded-full" />
      </Field>
    </FieldGroup>

    <Skeleton className="h-px w-full" />

    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="invisible max-w-48 text-sm">You can finish this later from your profile.</p>
      <Skeleton className="h-9 w-40 rounded-full" />
    </div>
  </div>
)
