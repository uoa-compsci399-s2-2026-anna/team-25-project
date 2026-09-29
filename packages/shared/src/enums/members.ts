export const MemberTitle = {
  DR: "dr",
  PROF: "prof",
  ASSOC_PROF: "assocProf",
  MR: "mr",
  MS: "ms",
  MRS: "mrs",
  MX: "mx",
} as const

export type MemberTitle = (typeof MemberTitle)[keyof typeof MemberTitle]

export const MemberTitleLabels: Record<MemberTitle, string> = {
  [MemberTitle.DR]: "Dr",
  [MemberTitle.PROF]: "Prof",
  [MemberTitle.ASSOC_PROF]: "Assoc Prof",
  [MemberTitle.MR]: "Mr",
  [MemberTitle.MS]: "Ms",
  [MemberTitle.MRS]: "Mrs",
  [MemberTitle.MX]: "Mx",
} as const
