import { MemberTitleLabels } from "@repo/shared/enums/members"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { canReadEmail, isAdmin, isAdminOrSelf } from "../access"
import { admin } from "../access/helpers"
import {
  enforceInstitutionDomain,
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
    beforeValidate: [enforceInstitutionDomain],
    afterChange: [revalidateMemberProposals],
    afterDelete: [revalidateDeletedMemberProposals],
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
    create: () => true, // public registration
    read: () => true, // public directory; sensitive fields gated below
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  fields: [
    {
      // Overrides the email field Payload adds by default, so we can gate who can read it.
      name: "email",
      type: "email",
      access: {
        read: canReadEmail,
      },
    },
    { name: "firstName", type: "text", required: true },
    { name: "lastName", type: "text", required: true },
    {
      name: "institution",
      type: "relationship",
      relationTo: Slugs.Collections.INSTITUTIONS,
      required: true,
    },
    {
      name: "title",
      type: "select",
      options: toSelectOptions(MemberTitleLabels),
    },
    { name: "position", type: "text", required: true },
    { name: "bio", type: "textarea" },
    { name: "researchInterests", type: "text", hasMany: true },
    {
      name: "links",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
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
