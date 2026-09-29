import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { InstitutionCountry } from "@repo/shared/enums/institutions"
import type { Institution, Member } from "@repo/shared/payload-types"
import type { Pagination } from "@repo/shared/types/pagination"
import { cacheLife, cacheTag } from "next/cache"
import { connection } from "next/server"
import type { Where } from "payload"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import type { MemberSort } from "./members.search-params"

/** Four cards across the grid's widest breakpoint, three rows of them. */
export const MEMBERS_PAGE_SIZE = 12

export type MemberFilters = {
  institutionId?: Institution["id"]
  country?: InstitutionCountry
  search?: string
  sort?: MemberSort
}

const memberFiltersToWhere = (filters: MemberFilters): Where => {
  const where: Where = {}

  const search = filters.search?.trim()
  if (search) {
    // Each word must hit a name, so "Priya Nair" matches across the two fields.
    where.and = search.split(/\s+/).map(
      (term): Where => ({
        or: [{ firstName: { contains: term } }, { lastName: { contains: term } }],
      }),
    )
  }

  if (filters.institutionId !== undefined) {
    where.institution = {
      equals: filters.institutionId,
    }
  }

  if (filters.country) {
    where["institution.country"] = {
      equals: filters.country,
    }
  }

  return where
}

/**
 * connection() because filtering on `institution` opens a Payload transaction, whose
 * randomUUID() id cacheComponents refuses to prerender. depth 1 resolves the card's data.
 */
export const getMembers = async (filters: MemberFilters, pagination: Pagination) => {
  await connection()
  const payload = await getPayloadClient()
  return payload.find({
    collection: Slugs.Collections.MEMBERS,
    ...pagination,
    depth: 1,
    // The Local API overrides access, so ask only for what the card draws.
    select: {
      avatar: true,
      firstName: true,
      institution: true,
      lastName: true,
      position: true,
    },
    // id breaks surname ties; without it paging can repeat or skip a member.
    sort: filters.sort === "surnameDesc" ? ["-lastName", "id"] : ["lastName", "id"],
    where: memberFiltersToWhere(filters),
  })
}

/** Counting stays accurate where find() reports no totals, so page counts derive from this. */
export const countMembers = async (filters: MemberFilters) => {
  await connection()
  const payload = await getPayloadClient()
  const { totalDocs } = await payload.count({
    collection: Slugs.Collections.MEMBERS,
    where: memberFiltersToWhere(filters),
  })
  return totalDocs
}

/** What the header reports: how many members these filters leave, out of the whole directory. */
export const getMemberCounts = async (filters: MemberFilters) => {
  const [shown, total] = await Promise.all([countMembers(filters), countMembers({})])
  return { shown, total }
}

// The local API overrides access, so `email` is always on the result regardless
// of `showEmailPublicly` - anything rendering it must gate it itself.
export const getMemberDetails = async (memberId: number): Promise<Member | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.MEMBERS,
    where: { id: { equals: memberId } },
    depth: 1,
    limit: 1,
    pagination: false,
  })
  return docs[0] ?? null
}

export const getMemberDetailsCached = async (memberId: number) => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.MEMBERS.ID(memberId))
  return getMemberDetails(memberId)
}

export const getMemberProposals = async (memberId: number) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.PROPOSALS,
    where: { author: { contains: memberId } },
    sort: "-createdAt",
    depth: 0,
    pagination: false,
    select: { title: true, proposalSlug: true, summary: true, status: true, createdAt: true },
  })
  return docs
}

export const getMemberProposalsCached = async (memberId: number) => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.PROPOSALS.ROOT)
  return getMemberProposals(memberId)
}

export const getMemberCoursesConvenedCount = async (memberId: number) => {
  const payload = await getPayloadClient()
  const { totalDocs } = await payload.count({
    collection: Slugs.Collections.COURSES,
    where: { owner: { equals: memberId } },
  })
  return totalDocs
}

export const getMemberCoursesConvenedCountCached = async (memberId: number) => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.COURSES.ROOT)
  return getMemberCoursesConvenedCount(memberId)
}

export type MemberCourse = {
  courseId: number
  code: string | null
  name: string | null
  period: string
}

/** The member's courses with a published offering, each shown by its newest offering. */
export const getMemberCourses = async (memberId: number): Promise<MemberCourse[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.COURSE_VERSIONS,
    where: {
      and: [{ "course.owner": { equals: memberId } }, { _status: { equals: "published" } }],
    },
    // Newest first, so the first offering seen for each course is its latest.
    sort: ["-startDate", "-id"],
    depth: 0,
    pagination: false,
    select: { course: true, period: true, name: true, displaySnapshot: { courseCode: true } },
  })

  const courses = new Map<number, MemberCourse>()
  for (const offering of docs) {
    const courseId = typeof offering.course === "number" ? offering.course : offering.course.id
    if (courses.has(courseId)) continue
    courses.set(courseId, {
      courseId,
      code: offering.displaySnapshot?.courseCode ?? null,
      name: offering.name ?? null,
      period: offering.period,
    })
  }
  return [...courses.values()]
}

export const getMemberCoursesCached = async (memberId: number) => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.COURSES.ROOT)
  return getMemberCourses(memberId)
}
