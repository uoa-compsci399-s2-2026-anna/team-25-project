import { CourseDeliveryFormat, CourseTermLabels } from "@repo/shared/enums/courses"
import { EARLIEST_OFFERING_YEAR, LATEST_OFFERING_YEAR } from "@repo/shared/schemas/courses"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { isSignedIn } from "../access"
import { versionHistoryRead, versionRead, versionWrite } from "../access/Courses/CourseVersions"
import { guardCourseWrite } from "../hooks"
import {
  assertVersionDeletable,
  prepareVersion,
  revalidateCourseVersions,
  revalidateDeletedCourseVersion,
} from "../hooks/CourseVersions"

/**
 * One document per teaching period. Payload versions hold that period's drafts
 * and its earlier publications, so the document ID identifies the offering and
 * a native revision ID identifies one saved state of it.
 */
export const CourseVersions: CollectionConfig = {
  slug: Slugs.Collections.COURSE_VERSIONS,
  labels: { singular: "Course offering", plural: "Course offerings" },
  admin: { useAsTitle: "period", defaultColumns: ["course", "period", "startDate", "_status"] },
  // One offering per teaching period. Drafts may leave the period unset, and
  // Postgres never treats two NULLs as equal, so any number of them can coexist.
  indexes: [{ fields: ["course", "year", "term"], unique: true }],
  versions: {
    drafts: {
      autosave: false,
    },
    maxPerDoc: 0,
  },
  access: {
    create: isSignedIn,
    read: versionRead,
    readVersions: versionHistoryRead,
    update: versionWrite,
    delete: versionWrite,
  },
  hooks: {
    beforeOperation: [guardCourseWrite],
    beforeValidate: [prepareVersion],
    beforeDelete: [assertVersionDeletable],
    afterChange: [revalidateCourseVersions],
    afterDelete: [revalidateDeletedCourseVersion],
  },
  fields: [
    {
      name: "course",
      type: "relationship",
      relationTo: Slugs.Collections.COURSES,
      required: true,
      index: true,
    },
    {
      type: "row",
      fields: [
        // Not `required`: a draft can exist before its teaching period is settled.
        // validatePeriod requires both for anything else.
        {
          name: "term",
          type: "select",
          options: toSelectOptions(CourseTermLabels),
          admin: { width: "50%" },
        },
        {
          name: "year",
          type: "number",
          min: EARLIEST_OFFERING_YEAR,
          max: LATEST_OFFERING_YEAR,
          admin: { width: "50%" },
        },
      ],
    },
    {
      // Derived from term and year by prepareVersion, so it can't drift from them.
      name: "period",
      type: "text",
      admin: { readOnly: true, description: "Derived from the term and year." },
    },
    { name: "startDate", type: "date", required: true, index: true },
    { name: "endDate", type: "date", required: true },
    {
      name: "changeSummary",
      type: "textarea",
      admin: { description: "Required when publishing changes to a published offering." },
    },
    { name: "publishedAt", type: "date", admin: { readOnly: true } },
    {
      name: "publishedBy",
      type: "relationship",
      relationTo: [Slugs.Collections.MEMBERS, Slugs.Collections.ADMIN],
      admin: { readOnly: true },
    },
    { name: "name", type: "text" },
    { name: "programme", type: "text" },
    { name: "deliveryFormat", type: "select", options: Object.values(CourseDeliveryFormat) },
    { name: "projectType", type: "text" },
    { name: "learningOutcomes", type: "richText" },
    { name: "assessments", type: "richText" },
    { name: "additionalInfo", label: "Additional information", type: "richText" },
    {
      name: "teachingTeam",
      type: "array",
      fields: [
        { name: "member", type: "relationship", relationTo: Slugs.Collections.MEMBERS },
        { name: "role", type: "text" },
      ],
    },
    {
      // Historical display values, so an old revision keeps the code, institution
      // name and teaching-team names it was published with. A collapsible wrapper
      // carries the one heading for the whole block, so the group's own label is
      // off and the array below it is the only nested heading. Last in the list,
      // and closed by default, so the editable fields lead.
      type: "collapsible",
      label: "Published snapshot",
      admin: {
        initCollapsed: true,
        description:
          "Written at publication and read-only. Empty until this offering is published.",
      },
      fields: [
        {
          name: "displaySnapshot",
          type: "group",
          label: false,
          admin: { readOnly: true },
          fields: [
            {
              type: "row",
              fields: [
                { name: "courseCode", type: "text", admin: { width: "50%" } },
                { name: "institutionName", type: "text", admin: { width: "50%" } },
              ],
            },
            {
              name: "teachingTeam",
              type: "array",
              label: "Teaching Team (as published)",
              fields: [
                { name: "name", type: "text" },
                { name: "role", type: "text" },
                { name: "memberId", type: "number" },
              ],
            },
          ],
        },
      ],
    },
  ],
}
