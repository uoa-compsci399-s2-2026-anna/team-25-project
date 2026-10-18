import type { Route } from "next"

export function route<T extends string>(path: Route<T>): Route<T> {
  return path
}

export const Routes = {
  HOME: route("/"),
  LOGIN: route("/login"),
  /** Payload's own admin UI, which only admins can reach (see payload.config.ts). */
  ADMIN: route("/payload/admin"),
  COURSES: {
    ROOT: route("/courses"),
    COURSE: (courseId: string) => route(`/courses/${courseId}`),
    /**
     * One offering of a course. The current offering's canonical URL is the plain
     * course URL, so `?offering=` is only added for any other one - and left off
     * without an `offeringId`, for the course's default.
     */
    OFFERING: (
      courseId: number | string,
      offeringId?: number | null,
      currentOfferingId?: number | null,
    ) =>
      offeringId && offeringId !== currentOfferingId
        ? route(`/courses/${courseId}?offering=${offeringId}`)
        : route(`/courses/${courseId}`),
  },
  MEMBERS: {
    ROOT: route("/members"),
    MEMBER: (memberId: number | string) => route(`/members/${memberId}`),
  },
  PROPOSALS: {
    ROOT: route("/proposals"),
    // The page resolves on the leading id; the slug is only for readability.
    PROPOSAL: (proposalId: number, proposalSlug?: string | null) =>
      route(`/proposals/${proposalSlug ? `${proposalId}-${proposalSlug}` : String(proposalId)}`),
  },
  ABOUT: route("/about"),
  NEWS: route("/news"),
  RESOURCES: {
    ROOT: route("/resources"),
    RESOURCE: (resourceId: string) => route(`/resources/${resourceId}`),
  },
  PUBLICATIONS: route("/publications"),
  PRIVACY: route("/privacy"),
  REGISTER: {
    ROOT: route("/register"),
    PROFILE: route("/register/profile"),
  },
} as const

type DeepValues<T> = T extends (...args: never[]) => infer R
  ? R
  : T extends object
    ? { [K in keyof T]: DeepValues<T[K]> }[keyof T]
    : T

export type AppRoute = DeepValues<typeof Routes>
