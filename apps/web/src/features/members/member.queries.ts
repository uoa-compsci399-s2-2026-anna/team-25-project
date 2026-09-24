import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Member } from "@repo/shared/payload-types"
import { cacheLife, cacheTag } from "next/cache"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

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
  cacheTag(QueryKeys.PROPOSALS)
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
    select: { course: true, period: true, name: true, displaySnapshot: true },
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
