/** Seeds the local database with an admin account and development fixtures. */
import path from "node:path"
import { fileURLToPath } from "node:url"
import { CourseDeliveryFormat } from "@repo/shared/enums/courses"
import { MemberTitle } from "@repo/shared/enums/members"
import {
  ProposalEthicsStatus,
  ProposalStatus,
  ProposalTag,
  ProposalTimeframeEndPeriod,
  ProposalTimeframeStartPeriod,
} from "@repo/shared/enums/proposals"
import { PublicationType } from "@repo/shared/enums/publications"
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
const SEED_FILES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "seed-files")

const institutions = [
  { name: "University of Auckland", country: "NZ", domain: "auckland.ac.nz" },
  { name: "University of Otago", country: "NZ", domain: "otago.ac.nz" },
  { name: "University of Melbourne", country: "AU", domain: "unimelb.edu.au" },
  { name: "UNSW Sydney", country: "AU", domain: "unsw.edu.au" },
] as const

const members = [
  {
    email: "arohan.patel@auckland.ac.nz",
    firstName: "Arohan",
    lastName: "Patel",
    institution: "University of Auckland",
    title: MemberTitle.DR,
    position: "Senior Lecturer",
    researchInterests: ["Code review", "Generative AI"],
    links: [
      { label: "Staff page", url: "https://profiles.auckland.ac.nz/arohan-patel" },
      { label: "GitHub", url: "https://github.com/arohan-patel" },
    ],
  },
  {
    email: "maya.chen@auckland.ac.nz",
    firstName: "Maya",
    lastName: "Chen",
    institution: "University of Auckland",
    title: MemberTitle.DR,
    position: "Lecturer",
    researchInterests: ["Belonging", "First-year programming"],
    links: [{ label: "ORCID", url: "https://orcid.org/0000-0002-1825-0097" }],
  },
  {
    email: "hana.rangi@otago.ac.nz",
    firstName: "Hana",
    lastName: "Rangi",
    institution: "University of Otago",
    title: MemberTitle.ASSOC_PROF,
    position: "Associate Professor",
    researchInterests: ["Authentic assessment", "Industry partnerships"],
    links: [{ label: "Staff page", url: "https://www.otago.ac.nz/staff/hana-rangi" }],
  },
  {
    email: "liam.wilson@otago.ac.nz",
    firstName: "Liam",
    lastName: "Wilson",
    institution: "University of Otago",
    title: MemberTitle.MR,
    position: "Teaching Fellow",
    researchInterests: ["Teamwork"],
    links: [],
  },
  {
    email: "priya.nair@unimelb.edu.au",
    firstName: "Priya",
    lastName: "Nair",
    institution: "University of Melbourne",
    title: MemberTitle.DR,
    position: "Senior Lecturer",
    researchInterests: ["Generative AI", "Assessment", "Qualitative methods"],
    links: [
      { label: "Staff page", url: "https://findanexpert.unimelb.edu.au/profile/priya-nair" },
      { label: "Website", url: "https://priyanair.example.com" },
    ],
  },
  {
    email: "noah.taylor@unsw.edu.au",
    firstName: "Noah",
    lastName: "Taylor",
    institution: "UNSW Sydney",
    title: MemberTitle.MX,
    position: "Lecturer",
    researchInterests: [],
    links: [],
  },
]

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
    "COMPSCI 399",
    "University of Auckland",
    "arohan.patel@auckland.ac.nz",
    ["maya.chen@auckland.ac.nz"],
  ],
  [
    "SOFTENG 770",
    "University of Auckland",
    "maya.chen@auckland.ac.nz",
    ["arohan.patel@auckland.ac.nz"],
  ],
  ["COSC 345", "University of Otago", "liam.wilson@otago.ac.nz", ["hana.rangi@otago.ac.nz"]],
  ["COMP30022", "University of Melbourne", "priya.nair@unimelb.edu.au", []],
  ["COMP3900", "UNSW Sydney", "noah.taylor@unsw.edu.au", []],
] as const

// Created as the course owner so the publication hooks write the snapshot and
// publisher, as they would for a real publication.
const offerings = [
  {
    course: "COMPSCI 399",
    status: "published",
    period: "2026 Semester 2",
    startDate: "2026-07-20T00:00:00.000Z",
    endDate: "2026-11-06T00:00:00.000Z",
    name: "Capstone: Computer Science",
    programme: "Bachelor of Science",
    deliveryFormat: CourseDeliveryFormat.IN_PERSON,
    projectType: "Team capstone project",
    learningOutcomes:
      "Work in a small team to analyse a substantial problem, design a solution, build an artefact and present it.",
    assessments: "Team project milestones, final artefact, presentation and individual reflection.",
    additionalInfo: "Projects come from industry clients. Teams meet their client every two weeks.",
    teachingTeam: [
      ["arohan.patel@auckland.ac.nz", "Course coordinator"],
      ["maya.chen@auckland.ac.nz", "Lecturer"],
    ],
  },
  {
    course: "COSC 345",
    status: "draft",
    period: "2027 Full Year",
    startDate: "2027-02-22T00:00:00.000Z",
    endDate: "2027-10-15T00:00:00.000Z",
    name: "Software Engineering",
    programme: "Bachelor of Science",
    deliveryFormat: CourseDeliveryFormat.IN_PERSON,
    projectType: "Year-long team software project",
    learningOutcomes:
      "Develop large-scale, reliable and maintainable software in a team of three or four.",
    assessments: "Four team project milestones (40%) and final exam (60%).",
    additionalInfo: undefined,
    teachingTeam: [["liam.wilson@otago.ac.nz", "Course coordinator"]],
  },
] as const

// DOIs use 10.5555, the prefix reserved for examples, so none resolves to a real paper.
const publications = [
  {
    citationKey: "nair2026genai",
    type: PublicationType.IN_PROCEEDINGS,
    title: "How capstone students judge generative AI feedback in code review",
    authors: [
      ["Priya Nair", "priya.nair@unimelb.edu.au"],
      ["Maya Chen", "maya.chen@auckland.ac.nz"],
      ["J. Okafor"],
    ],
    year: 2026,
    month: 2,
    doi: "10.5555/capstone.2026.001",
    url: "https://example.com/publications/nair2026genai",
    venue: "Australasian Computing Education Conference",
    pages: "41-50",
    publisher: "Example Press",
    abstract:
      "We interviewed 38 capstone students at two universities about the AI feedback they received during code review. Students trusted comments on style more than comments on design, and few checked a suggestion before they applied it. We give four guidelines for teaching teams.",
    tags: ["Generative AI", "Code review"],
  },
  {
    citationKey: "patel2025review",
    type: PublicationType.ARTICLE,
    title: "Peer code review as assessment in team capstones",
    authors: [
      ["Arohan Patel", "arohan.patel@auckland.ac.nz"],
      ["Liam Wilson", "liam.wilson@otago.ac.nz"],
    ],
    year: 2025,
    month: 9,
    doi: "10.5555/capstone.2025.014",
    venue: "Journal of Computing Capstone Education",
    volume: "12",
    issue: "3",
    pages: "201-219",
    abstract:
      "Marking review comments, not only the code, changed how students reviewed. Comments became longer and more specific across three course offerings.",
    tags: ["Code review", "Assessment"],
  },
  {
    citationKey: "rangi2025partners",
    type: PublicationType.ARTICLE,
    title: "What industry partners want from a capstone project",
    authors: [
      ["Hana Rangi", "hana.rangi@otago.ac.nz"],
      ["Noah Taylor", "noah.taylor@unsw.edu.au"],
      ["S. Whitfield"],
    ],
    year: 2025,
    month: 4,
    doi: "10.5555/capstone.2025.006",
    url: "https://example.com/publications/rangi2025partners",
    venue: "Journal of Computing Capstone Education",
    volume: "12",
    issue: "1",
    pages: "33-52",
    abstract:
      "A survey of 61 industry clients in Aotearoa New Zealand and Australia. Clients put communication and reliability above technical skill.",
    tags: ["Industry partnerships", "Authentic assessment"],
  },
  {
    citationKey: "chen2025belonging",
    type: PublicationType.IN_PROCEEDINGS,
    title: "Belonging from first year to capstone: a four-year cohort study",
    authors: [
      ["Maya Chen", "maya.chen@auckland.ac.nz"],
      ["Arohan Patel", "arohan.patel@auckland.ac.nz"],
    ],
    year: 2025,
    month: 1,
    doi: "10.5555/capstone.2025.002",
    venue: "Australasian Computing Education Conference",
    pages: "112-121",
    tags: ["Belonging"],
  },
  {
    citationKey: "wilson2024teams",
    type: PublicationType.MASTERS_THESIS,
    title: "Team formation methods in year-long software projects",
    authors: [["Liam Wilson", "liam.wilson@otago.ac.nz"]],
    year: 2024,
    month: 11,
    url: "https://example.com/publications/wilson2024teams",
    venue: "University of Otago",
    abstract:
      "Compares self-selected, random and skill-balanced teams across four cohorts. Skill-balanced teams had fewer conflicts but no better marks.",
    tags: ["Teamwork"],
  },
  {
    citationKey: "nair2024rubrics",
    type: PublicationType.ARTICLE,
    title: "Rubrics that survive generative AI",
    authors: [
      ["Priya Nair", "priya.nair@unimelb.edu.au"],
      ["Hana Rangi", "hana.rangi@otago.ac.nz"],
    ],
    year: 2024,
    month: 6,
    doi: "10.5555/capstone.2024.021",
    venue: "Computing Education Review",
    volume: "8",
    issue: "2",
    pages: "77-95",
    tags: ["Generative AI", "Assessment"],
  },
  {
    citationKey: "taylor2024handbook",
    type: PublicationType.MANUAL,
    title: "A handbook for capstone client meetings",
    authors: [["Noah Taylor", "noah.taylor@unsw.edu.au"]],
    year: 2024,
    url: "https://example.com/publications/taylor2024handbook",
    venue: "UNSW Sydney",
    tags: ["Industry partnerships"],
  },
  {
    citationKey: "patel2023contribution",
    type: PublicationType.TECH_REPORT,
    title: "Measuring individual contribution from version control data",
    authors: [["Arohan Patel", "arohan.patel@auckland.ac.nz"], ["R. Singh"], ["T. Faleolo"]],
    year: 2023,
    month: 8,
    venue: "University of Auckland",
    abstract:
      "Commit counts mislead. We test five measures against peer ratings from 54 teams and recommend that markers use none of them alone.",
    tags: ["Teamwork", "Assessment"],
  },
  {
    citationKey: "rangi2023chapter",
    type: PublicationType.IN_BOOK,
    title: "Assessment that looks like work",
    authors: [["Hana Rangi", "hana.rangi@otago.ac.nz"]],
    year: 2023,
    doi: "10.5555/capstone.2023.009",
    venue: "Teaching Software Engineering in Practice",
    pages: "145-168",
    publisher: "Example Press",
    tags: ["Authentic assessment"],
  },
  {
    citationKey: "chen2022reflection",
    type: PublicationType.IN_PROCEEDINGS,
    title: "Do individual reflections show who did the work?",
    authors: [["Maya Chen", "maya.chen@auckland.ac.nz"], ["A. Lindqvist"]],
    year: 2022,
    month: 7,
    doi: "10.5555/capstone.2022.017",
    venue: "Conference on Innovation in Computing Education",
    pages: "301-307",
    tags: ["Assessment", "Qualitative methods"],
  },
  {
    citationKey: "nair2021thesis",
    type: PublicationType.PHD_THESIS,
    title: "Feedback practices in project-based computing courses",
    authors: [["Priya Nair", "priya.nair@unimelb.edu.au"]],
    year: 2021,
    month: 12,
    url: "https://example.com/publications/nair2021thesis",
    venue: "University of Melbourne",
    abstract:
      "Three studies of how teachers give feedback on team software projects, and how students use it.",
    tags: ["Assessment", "Qualitative methods"],
  },
  {
    citationKey: "wilson2021remote",
    type: PublicationType.MISC,
    title: "Running a capstone showcase online",
    authors: [
      ["Liam Wilson", "liam.wilson@otago.ac.nz"],
      ["Noah Taylor", "noah.taylor@unsw.edu.au"],
    ],
    year: 2021,
    url: "https://example.com/publications/wilson2021remote",
    venue: "arXiv",
  },
] as const

// More than one page of the resources list, so its paging can be tried. Each is created
// as its owner, who must own or edit the linked course for the course filter to accept it.
// Attachments name PDFs in seed-files/.
const resources = [
  {
    title: "Individual contribution rubric for team projects",
    owner: "arohan.patel@auckland.ac.nz",
    course: "COMPSCI 399",
    attachments: ["individual-contribution-rubric.pdf", "moderation-notes.pdf"],
    description:
      "Four-criterion rubric with moderation notes, used to turn a team mark into individual marks for a 180-student cohort since 2022.",
  },
  {
    title: "Industry partner agreement template",
    owner: "arohan.patel@auckland.ac.nz",
    course: "COMPSCI 399",
    attachments: ["industry-partner-agreement-template.pdf"],
    description:
      "Plain-language agreement covering IP, confidentiality and weekly client time, reviewed by the university's legal team.",
  },
  {
    title: "Team formation survey",
    owner: "maya.chen@auckland.ac.nz",
    course: "COMPSCI 399",
    description:
      "Survey on skills, timetables and working styles that feeds the team allocation spreadsheet.",
  },
  {
    title: "Sprint retrospective prompts",
    owner: "maya.chen@auckland.ac.nz",
    course: "SOFTENG 770",
    description:
      "Twelve prompts for fortnightly retrospectives, ordered from easy openers to harder questions about team conflict.",
  },
  {
    title: "Final presentation marking sheet",
    owner: "maya.chen@auckland.ac.nz",
    course: "SOFTENG 770",
    attachments: ["final-presentation-marking-sheet.pdf"],
    description:
      "One-page sheet for markers and clients, with descriptors for the demo, the technical talk and the questions.",
  },
  {
    title: "Client kickoff meeting checklist",
    owner: "liam.wilson@otago.ac.nz",
    course: "COSC 345",
    description:
      "What to settle in the first client meeting: scope, contact hours, access to systems and what done looks like.",
  },
  {
    title: "Peer assessment moderation guide",
    owner: "hana.rangi@otago.ac.nz",
    course: "COSC 345",
    description:
      "How we spot and moderate outlying peer marks, with worked examples from three semesters.",
  },
  {
    title: "Code review guidelines for student teams",
    owner: "priya.nair@unimelb.edu.au",
    course: "COMP30022",
    description:
      "Short guide to reviewing a teammate's pull request, including how to use AI review tools without trusting them blindly.",
  },
  {
    title: "Project proposal template",
    owner: "priya.nair@unimelb.edu.au",
    course: "COMP30022",
    description:
      "Template clients fill in to pitch a project, with examples of a well-scoped and a badly scoped proposal.",
  },
  {
    title: "Ethics approval walkthrough",
    owner: "noah.taylor@unsw.edu.au",
    course: "COMP3900",
    description:
      "Step-by-step notes on getting low-risk ethics approval for projects that collect data from users.",
  },
  {
    title: "Conflict resolution playbook",
    owner: "noah.taylor@unsw.edu.au",
    course: "COMP3900",
    description:
      "Escalation steps for team conflict, from a facilitated conversation to a change of team, with email templates.",
  },
  {
    title: "Reading list: software engineering capstones",
    owner: "hana.rangi@otago.ac.nz",
    description:
      "Papers and book chapters we give new capstone coordinators, grouped by assessment, teamwork and industry partners.",
  },
  {
    title: "Weekly status report template",
    owner: "liam.wilson@otago.ac.nz",
    description: "Half-page template teams send their client each week: done, next, blocked.",
  },
  {
    title: "Capstone coordinator onboarding notes",
    owner: "noah.taylor@unsw.edu.au",
    description:
      "What a new coordinator needs in their first month, from booking rooms to recruiting clients.",
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
  for (const { email, institution, ...profile } of members) {
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
          ...profile,
          institution: requiredID(institutionIds, institution),
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
          context: SEED_CONTEXT,
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
    additionalInfo,
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
          additionalInfo: additionalInfo ? richText(additionalInfo) : undefined,
          teachingTeam: teachingTeam.map(([email, role]) => ({
            member: requiredID(memberIds, email),
            role,
          })),
        },
        draft: status === "draft",
        user: { ...owner, collection: Slugs.Collections.MEMBERS },
        context: SEED_CONTEXT,
      })
    }
  }

  for (const { authors, ...fixture } of publications) {
    const existing = await payload.find({
      collection: Slugs.Collections.PUBLICATIONS,
      where: { citationKey: { equals: fixture.citationKey } },
      depth: 0,
      limit: 1,
    })
    if (existing.docs.length === 0) {
      await payload.create({
        collection: Slugs.Collections.PUBLICATIONS,
        data: {
          ...fixture,
          tags: "tags" in fixture ? [...fixture.tags] : undefined,
          authors: authors.map(([name, email]) => ({
            name,
            member: email ? requiredID(memberIds, email) : undefined,
          })),
        },
        context: SEED_CONTEXT,
      })
    }
  }

  for (const fixture of resources) {
    const owner = await payload.findByID({
      collection: Slugs.Collections.MEMBERS,
      id: requiredID(memberIds, fixture.owner),
      depth: 0,
    })
    const user = { ...owner, collection: Slugs.Collections.MEMBERS }

    const attachments: number[] = []
    for (const filename of "attachments" in fixture ? fixture.attachments : []) {
      // Matched on the stem: Payload saves "notes-1.pdf" when "notes.pdf" is still in the local
      // upload folder, which outlives a database reset, so an exact match would upload a copy each run.
      const existing = await payload.find({
        collection: Slugs.Collections.RESOURCE_ATTACHMENTS,
        where: { filename: { like: path.parse(filename).name } },
        depth: 0,
        limit: 1,
      })
      const attachment =
        existing.docs[0] ??
        (await payload.create({
          collection: Slugs.Collections.RESOURCE_ATTACHMENTS,
          data: {},
          filePath: path.join(SEED_FILES_DIR, filename),
          user,
          context: SEED_CONTEXT,
        }))
      attachments.push(attachment.id)
    }

    const existing = await payload.find({
      collection: Slugs.Collections.RESOURCES,
      where: { title: { equals: fixture.title } },
      depth: 0,
      limit: 1,
    })
    const resource = existing.docs[0]
    if (!resource) {
      await payload.create({
        collection: Slugs.Collections.RESOURCES,
        data: {
          title: fixture.title,
          owner: owner.id,
          course: "course" in fixture ? requiredID(courseIds, fixture.course) : undefined,
          description: richText(fixture.description),
          attachments,
        },
        user,
        context: SEED_CONTEXT,
      })
    } else if (attachments.length > 0 && !resource.attachments?.length) {
      // Databases seeded before attachments were added still pick them up on the next run.
      await payload.update({
        collection: Slugs.Collections.RESOURCES,
        id: resource.id,
        data: { attachments },
        user,
        context: SEED_CONTEXT,
      })
    }
  }

  payload.logger.info(
    `Seed complete: ${institutions.length} institutions, ${members.length} members, ${proposals.length} proposals, ${publications.length} publications, ${courses.length} courses, ${offerings.length} course offerings and ${resources.length} resources. Mock member password: ${MEMBER_PASSWORD}.`,
  )
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
