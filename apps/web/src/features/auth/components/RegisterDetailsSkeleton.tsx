import { Field, FieldGroup, FieldLabel, Skeleton } from "@repo/ui/components/ui"

/**
 * Built from the same Field primitives as RegisterDetailsForm, with the label
 * text rendered invisibly rather than measured. Hand-matched heights drift by a
 * fraction of a pixel per label - enough, across six of them, to resize the page
 * and shift the footer when the real form streams in.
 */
const FieldSkeleton = ({ label }: { label: string }) => (
  <Field>
    <FieldLabel className="invisible" htmlFor="skeleton">
      {label}
    </FieldLabel>
    <Skeleton className="h-10 w-full rounded-md" />
  </Field>
)

export const RegisterDetailsSkeleton = () => (
  <div className="flex flex-col gap-8">
    <FieldGroup>
      <div className="grid gap-6 sm:grid-cols-2">
        <FieldSkeleton label="First name" />
        <FieldSkeleton label="Surname" />
      </div>
      <FieldSkeleton label="University / Institution" />
      <FieldSkeleton label="University email" />
      <FieldSkeleton label="Password" />
      <Field orientation="horizontal">
        <Skeleton className="size-4 rounded-[4px]" />
        <FieldLabel className="invisible" htmlFor="skeleton">
          I agree to the community guidelines and privacy policy.
        </FieldLabel>
      </Field>
    </FieldGroup>
    <Skeleton className="h-11 w-full rounded-full" />
  </div>
)
