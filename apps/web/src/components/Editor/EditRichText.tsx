"use client"

import { RichTextEditor, type RichTextValue } from "@repo/ui/components/composite"
import type { ReactNode } from "react"
import { EditField } from "./EditField"

/** A rich-text attribute. The editor reads its value on mount, which is when editing starts. */
export const EditRichText = ({
  className,
  label,
  name,
  value,
  view,
}: {
  className?: string
  label: string
  name: string
  value: RichTextValue | null | undefined
  view?: ReactNode
}) => (
  <EditField<RichTextValue | null> label={label} name={name} value={value ?? null} view={view}>
    {(control) => (
      <>
        {/* The editor takes no aria-label, so it's named by this hidden label. */}
        <span className="sr-only" id={`${control.id}-label`}>
          {control.label}
        </span>
        <RichTextEditor
          aria-invalid={control.invalid}
          aria-labelledby={`${control.id}-label`}
          className={className}
          defaultValue={control.value}
          disabled={control.disabled}
          id={control.id}
          onBlur={control.onBlur}
          onChange={control.setValue}
        />
      </>
    )}
  </EditField>
)
