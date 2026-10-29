import type { Route } from "next"

export function route<T extends string>(path: Route<T>): Route<T> {
  return path
}

export const Routes = {
  HOME: route("/"),
  LOGIN: route("/login"),
  /** Payload's own admin UI, which only admins can reach (see payload.config.ts). */
  ADMIN: route("/admin"),
  COURSES: {
    ROOT: route("/courses"),
    // Without `offeringId`, the course page shows the course's current offering.
    COURSE: (courseId: number | string, offeringId?: number) =>
      route(offeringId ? `/courses/${courseId}?offering=${offeringId}` : `/courses/${courseId}`),
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
  NEWS: route("/news"),
  RESOURCES: {
    ROOT: route("/resources"),
    RESOURCE: (resourceId: string) => route(`/resources/${resourceId}`),
  },
  PUBLICATIONS: route("/publications"),
  PRIVACY: route("/privacy"),
  GUIDELINES: route("/guidelines"),
  PASSWORD: {
    // With `email`, the form starts filled in, e.g. from what was typed on login.
    FORGOT: (email?: string) =>
      route(email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"),
    /** Opened from the emailed reset link, which carries `?token=`. */
    RESET: route("/reset-password"),
  },
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
