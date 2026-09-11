import { Field, FieldDescription, FieldGroup, FieldLabel, Skeleton } from "@repo/ui/components/ui"

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
          Position
        </FieldLabel>
        <Skeleton className="h-8 w-full rounded-md" />
      </Field>
      <Field>
        <FieldLabel className="invisible" htmlFor="skeleton">
          About you
        </FieldLabel>
        <Skeleton className="h-16 w-full rounded-md" />
        <FieldDescription className="invisible">
          This is what other members see in the directory.
        </FieldDescription>
      </Field>
    </FieldGroup>

    <Skeleton className="h-px w-full" />

    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="invisible max-w-48 text-sm">You can finish this later from your profile.</p>
      <Skeleton className="h-9 w-40 rounded-full" />
    </div>
  </div>
)
