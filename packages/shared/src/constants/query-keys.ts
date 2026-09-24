export const QueryKeys = {
  INSTITUTIONS: "institutions",
  PROPOSALS: "proposals",
  COURSES: {
    ROOT: "courses",
    ID: (id: number) => `courses:${id}`,
  } as const,
  MEMBERS: {
    ROOT: "members",
    ID: (id: number) => `member:${id}`,
  } as const,
} as const
