/** Seeds the local database with an admin account and development fixtures. */
import { CourseDeliveryFormat } from "@repo/shared/enums/courses"
import {
  ProposalEthicsStatus,
  ProposalStatus,
  ProposalTag,
  ProposalTimeframeEndPeriod,
  ProposalTimeframeStartPeriod,
} from "@repo/shared/enums/proposals"
import type { Proposal } from "@repo/shared/payload-types"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { internal } from "./hooks/helpers"
import "dotenv/config"

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com"
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "changeme"
const ADMIN_FIRST_NAME = process.env.SEED_ADMIN_FIRST_NAME || "Admin"
const ADMIN_LAST_NAME = process.env.SEED_ADMIN_LAST_NAME || "User"
const MEMBER_PASSWORD = "changeme"
const SEED_CONTEXT = { disableRevalidate: true }

const institutions = [
  { name: "University of Auckland", country: "NZ", domain: "auckland.ac.nz" },
  { name: "University of Otago", country: "NZ", domain: "otago.ac.nz" },
  { name: "University of Melbourne", country: "AU", domain: "unimelb.edu.au" },
  { name: "UNSW Sydney", country: "AU", domain: "unsw.edu.au" },
] as const

const members = [
  ["arohan.patel@auckland.ac.nz", "Arohan", "Patel", "University of Auckland", "Senior Lecturer"],
  ["maya.chen@auckland.ac.nz", "Maya", "Chen", "University of Auckland", "Lecturer"],
  ["hana.rangi@otago.ac.nz", "Hana", "Rangi", "University of Otago", "Associate Professor"],
  ["liam.wilson@otago.ac.nz", "Liam", "Wilson", "University of Otago", "Teaching Fellow"],
  ["priya.nair@unimelb.edu.au", "Priya", "Nair", "University of Melbourne", "Senior Lecturer"],
  ["noah.taylor@unsw.edu.au", "Noah", "Taylor", "UNSW Sydney", "Lecturer"],
] as const

const proposals = [
  {
    title: "How students use generative AI during code review",
    authors: ["priya.nair@unimelb.edu.au", "maya.chen@auckland.ac.nz"],
    summary:
      "A multi-institution study of how students use and evaluate generative AI feedback during code review.",
    body: "We will compare student code-review practices and develop guidance for responsible use.",
    startYear: 2026,
    startPeriod: ProposalTimeframeStartPeriod.SEM_2,
    endYear: 2027,
    endPeriod: ProposalTimeframeEndPeriod.MID,
    ethics: ProposalEthicsStatus.NEW_APPLICATION_NEEDED,
    tags: [ProposalTag.GENERATIVE_AI, ProposalTag.ASSESSMENT],
    status: ProposalStatus.ACTIVE,
  },
  {
    title: "Belonging in first-year programming courses",
    authors: ["arohan.patel@auckland.ac.nz", "hana.rangi@otago.ac.nz"],
    summary:
      "A shared study of the factors that help first-year programming students feel that they belong.",
    body: "The project will compare results across institutions and identify practical course changes.",
    startYear: 2027,
    startPeriod: ProposalTimeframeStartPeriod.SEM_1,
    endYear: 2027,
    endPeriod: ProposalTimeframeEndPeriod.LATE,
    ethics: ProposalEthicsStatus.UNKNOWN,
    tags: [ProposalTag.CURRICULUM, ProposalTag.QUALITATIVE],
    status: ProposalStatus.ACTIVE,
  },
  {
    title: "Authentic assessment with industry partners",
    authors: ["noah.taylor@unsw.edu.au", "maya.chen@auckland.ac.nz"],
    summary:
      "A comparison of industry projects and their effect on teamwork and assessment quality.",
    body: "We will publish reusable patterns based on student, teacher and industry feedback.",
    startYear: 2026,
    startPeriod: ProposalTimeframeStartPeriod.SEM_1,
    endYear: 2026,
    endPeriod: ProposalTimeframeEndPeriod.LATE,
    ethics: ProposalEthicsStatus.APPROVED,
    tags: [ProposalTag.INDUSTRY, ProposalTag.TEAMWORK, ProposalTag.ASSESSMENT],
    status: ProposalStatus.CLOSED,
  },
] as const

const courses = [
  [
    "COMPSCI 101",
    "University of Auckland",
    "arohan.patel@auckland.ac.nz",
    ["maya.chen@auckland.ac.nz"],
  ],
  [
    "SOFTENG 701",
    "University of Auckland",
    "maya.chen@auckland.ac.nz",
    ["arohan.patel@auckland.ac.nz"],
  ],
  ["COSC 241", "University of Otago", "liam.wilson@otago.ac.nz", ["hana.rangi@otago.ac.nz"]],
  ["COMP30023", "University of Melbourne", "priya.nair@unimelb.edu.au", []],
  ["COMP3900", "UNSW Sydney", "noah.taylor@unsw.edu.au", []],
] as const

// Created as the course owner so the publication hooks write the snapshot and
// publisher, as they would for a real publication.
const offerings = [
  {
    course: "COMPSCI 101",
    status: "published",
    period: "2026 Semester 2",
    startDate: "2026-07-20T00:00:00.000Z",
    endDate: "2026-11-06T00:00:00.000Z",
    name: "Principles of Programming",
    programme: "Bachelor of Science",
    deliveryFormat: CourseDeliveryFormat.IN_PERSON,
    projectType: "Individual programming assignments",
    learningOutcomes: "Write, test and debug small Python programs that solve practical problems.",
    assessments: "Weekly labs (20%), four assignments (40%), test (10%) and final exam (30%).",
    teachingTeam: [
      ["arohan.patel@auckland.ac.nz", "Course coordinator"],
      ["maya.chen@auckland.ac.nz", "Lecturer"],
    ],
  },
  {
    course: "COSC 241",
    status: "draft",
    period: "2027 Semester 1",
    startDate: "2027-02-22T00:00:00.000Z",
    endDate: "2027-06-11T00:00:00.000Z",
    name: "Programming and Problem Solving",
    programme: "Bachelor of Science",
    deliveryFormat: CourseDeliveryFormat.HYBRID,
    projectType: "Team software project",
    learningOutcomes: "Design and implement data structures and algorithms in Java.",
    assessments: "Labs (20%), team project (30%) and final exam (50%).",
    teachingTeam: [["liam.wilson@otago.ac.nz", "Course coordinator"]],
  },
] as const

const richText = (text: string): Proposal["body"] => ({
  root: {
    type: "root",
    direction: null,
    format: "",
    indent: 0,
    version: 1,
    children: [
      {
        type: "paragraph",
        direction: null,
        format: "",
        indent: 0,
        version: 1,
        children: [{ type: "text", text, version: 1 }],
      },
    ],
  },
})

const requiredID = (ids: Map<string, number>, key: string): number => {
  const id = ids.get(key)
  if (id === undefined) throw new Error(`Seed relationship not found: ${key}`)
  return id
}

export const seed = async () => {
  const payload = await getPayloadClient()

  const existingAdmin = await payload.find({
    collection: Slugs.Collections.ADMIN,
    where: { email: { equals: ADMIN_EMAIL } },
    limit: 1,
  })
  if (existingAdmin.docs.length === 0) {
    await payload.create({
      collection: Slugs.Collections.ADMIN,
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
      },
    })
  }

  const institutionIds = new Map<string, number>()
  for (const fixture of institutions) {
    const existing = await payload.find({
      collection: Slugs.Collections.INSTITUTIONS,
      where: { name: { equals: fixture.name } },
      depth: 0,
      limit: 1,
    })
    const institution =
      existing.docs[0] ??
      (await payload.create({
        collection: Slugs.Collections.INSTITUTIONS,
        data: {
          name: fixture.name,
          country: fixture.country,
          domains: [{ domain: fixture.domain }],
        },
        context: SEED_CONTEXT,
      }))
    institutionIds.set(fixture.name, institution.id)
  }

  const memberIds = new Map<string, number>()
  for (const [email, firstName, lastName, institution, position] of members) {
    const existing = await payload.find({
      collection: Slugs.Collections.MEMBERS,
      where: { email: { equals: email } },
      depth: 0,
      limit: 1,
    })
    const member =
      existing.docs[0] ??
      (await payload.create({
        collection: Slugs.Collections.MEMBERS,
        data: {
          email,
          firstName,
          lastName,
          institution: requiredID(institutionIds, institution),
          position,
          password: MEMBER_PASSWORD,
        },
        context: SEED_CONTEXT,
      }))
    memberIds.set(email, member.id)
  }

  for (const {
    authors,
    body,
    startYear,
    startPeriod,
    endYear,
    endPeriod,
    ...fixture
  } of proposals) {
    const existing = await payload.find({
      collection: Slugs.Collections.PROPOSALS,
      where: { title: { equals: fixture.title } },
      depth: 0,
      limit: 1,
    })
    if (existing.docs.length === 0) {
      await payload.create({
        collection: Slugs.Collections.PROPOSALS,
        data: {
          ...fixture,
          tags: [...fixture.tags],
          author: authors.map((email) => requiredID(memberIds, email)),
          body: richText(body),
          timeframe: { startYear, startPeriod, endYear, endPeriod },
        },
        context: SEED_CONTEXT,
      })
    }
  }

  const courseIds = new Map<string, number>()
  const courseOwners = new Map<string, number>()
  for (const [code, institutionName, owner, editors] of courses) {
    const institution = requiredID(institutionIds, institutionName)
    const existing = await payload.find({
      collection: Slugs.Collections.COURSES,
      where: { and: [{ code: { equals: code } }, { institution: { equals: institution } }] },
      depth: 0,
      limit: 1,
    })
    const course =
      existing.docs[0] ??
      (await internal.run(true, () =>
        payload.create({
          collection: Slugs.Collections.COURSES,
          data: {
            code,
            institution,
            owner: requiredID(memberIds, owner),
            editors: editors.map((email) => requiredID(memberIds, email)),
          },
        }),
      ))
    courseIds.set(code, course.id)
    courseOwners.set(code, requiredID(memberIds, owner))
  }

  for (const {
    course: code,
    status,
    learningOutcomes,
    assessments,
    teachingTeam,
    ...fixture
  } of offerings) {
    const course = requiredID(courseIds, code)
    const existing = await payload.find({
      collection: Slugs.Collections.COURSE_VERSIONS,
      where: { and: [{ course: { equals: course } }, { period: { equals: fixture.period } }] },
      depth: 0,
      limit: 1,
    })
    if (existing.docs.length === 0) {
      const owner = await payload.findByID({
        collection: Slugs.Collections.MEMBERS,
        id: requiredID(courseOwners, code),
        depth: 0,
      })
      await payload.create({
        collection: Slugs.Collections.COURSE_VERSIONS,
        data: {
          ...fixture,
          course,
          _status: status,
          learningOutcomes: richText(learningOutcomes),
          assessments: richText(assessments),
          teachingTeam: teachingTeam.map(([email, role]) => ({
            member: requiredID(memberIds, email),
            role,
          })),
        },
        draft: status === "draft",
        user: { ...owner, collection: Slugs.Collections.MEMBERS },
      })
    }
  }

  payload.logger.info(
    `Seed complete: ${institutions.length} institutions, ${members.length} members, ${proposals.length} proposals, ${courses.length} courses and ${offerings.length} course offerings. Mock member password: ${MEMBER_PASSWORD}.`,
  )
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
