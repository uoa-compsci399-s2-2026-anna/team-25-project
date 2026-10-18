"use client"

import { memberProfileSchema } from "@repo/shared/schemas/members"
import type { ReactNode } from "react"
import { EditProvider, zodFormErrors } from "@/components/Editor/EditContext"
import { toProfileFormData } from "../../actions/profileFormData"
import { updateMemberProfile } from "../../actions/updateMemberProfile"
import type { ProfileValues } from "./memberEditFields"

const validateProfile = zodFormErrors(memberProfileSchema)

/** The editor wired to the member profile: checked against its schema, saved via updateMemberProfile. */
export const MemberEditProvider = ({ children }: { children: ReactNode }) => (
  <EditProvider<ProfileValues>
    onSave={(values) => updateMemberProfile(toProfileFormData(values))}
    validate={validateProfile}
  >
    {children}
  </EditProvider>
)
