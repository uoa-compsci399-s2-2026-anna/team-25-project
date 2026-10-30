import { MemberTitleLabels } from "@repo/shared/enums/members"
import {
  DEPARTMENT_MAX_LENGTH,
  FACULTY_MAX_LENGTH,
  LINK_LABEL_MAX_LENGTH,
  LINKS_MAX,
  POSITION_MAX_LENGTH,
  RESEARCH_INTEREST_MAX_LENGTH,
  RESEARCH_INTERESTS_MAX,
  TEACHING_INTEREST_MAX_LENGTH,
  TEACHING_INTERESTS_MAX,
} from "@repo/shared/schemas/register"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { canReadEmail, isAdmin, isAdminOrSelf } from "../access"
import { admin } from "../access/helpers"
import {
  allowPasswordChangesFromAppOnly,
  assertMemberDeletable,
  enforceInstitutionDomain,
  normaliseStoredInterests,
  refuseIdentityChangesFromMembers,
  revalidateDeletedMemberProposals,
  revalidateMemberProposals,
} from "../hooks/Members"
import { validateMemberLinkUrl } from "../validation/Members"

export const Members: CollectionConfig = {
  slug: Slugs.Collections.MEMBERS,
  admin: {
    useAsTitle: "email",
  },
  hooks: {
    beforeOperation: [allowPasswordChangesFromAppOnly, refuseIdentityChangesFromMembers],
    beforeValidate: [enforceInstitutionDomain],
    afterChange: [revalidateMemberProposals],
    afterDelete: [revalidateDeletedMemberProposals],
    beforeDelete: [assertMemberDeletable],
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 1000 * 60 * 15, // 15 min lockout
    tokenExpiration: 60 * 60 * 8, // 8 h
    useSessions: true,
    cookies: {
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  access: {
    // Registration goes through registerMember, which checks the emailed code first.
    // A direct API create would skip that check, so it stays with admins.
    create: ({ req }) => Boolean(req.context.registeringVerifiedMember) || admin(req),
    read: () => true, // public directory; sensitive fields gated below
    update: isAdminOrSelf,
    delete: isAdmin,
    unlock: isAdmin,
  },
  fields: [
    {
      // Overrides the email field Payload adds by default, so we can gate who can read it.
      name: "email",
      type: "email",
      access: {
        read: canReadEmail,
        // Sign-up verifies the address. A later change would skip that check.
        update: ({ req }) => admin(req),
      },
    },
    { name: "firstName", type: "text", required: true },
    { name: "lastName", type: "text", required: true },
    {
      name: "institution",
      type: "relationship",
      relationTo: Slugs.Collections.INSTITUTIONS,
      required: true,
      // Must match the verified email's domain.
      access: { update: ({ req }) => admin(req) },
    },
    {
      name: "title",
      type: "select",
      options: toSelectOptions(MemberTitleLabels),
    },
    { name: "position", type: "text", required: true, maxLength: POSITION_MAX_LENGTH },
    { name: "department", type: "text", maxLength: DEPARTMENT_MAX_LENGTH },
    { name: "faculty", type: "text", maxLength: FACULTY_MAX_LENGTH },
    { name: "bio", type: "textarea" },
    {
      name: "researchInterests",
      type: "text",
      hasMany: true,
      maxRows: RESEARCH_INTERESTS_MAX,
      // With hasMany, maxLength applies to each interest rather than the list.
      maxLength: RESEARCH_INTEREST_MAX_LENGTH,
      hooks: { beforeValidate: [normaliseStoredInterests] },
    },
    {
      name: "teachingInterests",
      type: "text",
      hasMany: true,
      maxRows: TEACHING_INTERESTS_MAX,
      maxLength: TEACHING_INTEREST_MAX_LENGTH,
      hooks: { beforeValidate: [normaliseStoredInterests] },
    },
    {
      name: "links",
      type: "array",
      maxRows: LINKS_MAX,
      fields: [
        { name: "label", type: "text", required: true, maxLength: LINK_LABEL_MAX_LENGTH },
        { name: "url", type: "text", required: true, validate: validateMemberLinkUrl },
      ],
    },
    { name: "avatar", type: "upload", relationTo: Slugs.Collections.MEDIA },
    {
      name: "showEmailPublicly",
      type: "checkbox",
      defaultValue: false,
      label: "Show my email address to visitors who aren't signed in",
    },
    {
      name: "lastReviewedAt",
      type: "date",
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      // Set once completeProfile succeeds - access below stops a member
      // setting this themselves through a direct API write.
      name: "registrationCompletedAt",
      type: "date",
      access: {
        create: () => false,
        update: ({ req }) => Boolean(req.context.completingRegistration) || admin(req),
      },
      admin: { readOnly: true, position: "sidebar" },
    },
  ],
}
