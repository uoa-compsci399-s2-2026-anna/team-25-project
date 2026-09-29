export const QueryKeys = {
  INSTITUTIONS: "institutions",
  PROPOSALS: {
    ROOT: "proposals",
    ID: (id: number) => `proposals:${id}`,
  } as const,
  COURSES: {
    ROOT: "courses",
    ID: (id: number) => `courses:${id}`,
  } as const,
  MEMBERS: {
    ROOT: "members",
    ID: (id: number) => `member:${id}`,
  } as const,
} as const
