"use client"

import { memberProfileSchema } from "@repo/shared/schemas/members"
import type { ReactNode } from "react"
import { toProfileFormData } from "../../actions/profileFormData"
import { updateMemberProfile } from "../../actions/updateMemberProfile"
import { MemberEdit } from "./memberEditFields"

/** The editor wired to the member profile: checked against its schema, saved via updateMemberProfile. */
export const MemberEditProvider = ({ children }: { children: ReactNode }) => (
  <MemberEdit.Provider
    onSave={(values) => updateMemberProfile(toProfileFormData(values))}
    schema={memberProfileSchema}
  >
    {children}
  </MemberEdit.Provider>
)
