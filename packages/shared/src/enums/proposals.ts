export const ProposalStatus = {
  ACTIVE: "active",
  CLOSED: "closed",
} as const

export type ProposalStatus = (typeof ProposalStatus)[keyof typeof ProposalStatus]

export const ProposalStatusLabels: Record<ProposalStatus, string> = {
  [ProposalStatus.ACTIVE]: "Active",
  [ProposalStatus.CLOSED]: "Closed",
} as const

export const ProposalEthicsStatus = {
  UNKNOWN: "unknown",
  NOT_REQUIRED: "notRequired",
  APPROVED: "approved",
  AMENDMENT_NEEDED: "amendmentNeeded",
  NEW_APPLICATION_NEEDED: "newApplicationNeeded",
} as const

export type ProposalEthicsStatus = (typeof ProposalEthicsStatus)[keyof typeof ProposalEthicsStatus]

export const ProposalEthicsStatusLabels: Record<ProposalEthicsStatus, string> = {
  [ProposalEthicsStatus.UNKNOWN]: "Not yet assessed",
  [ProposalEthicsStatus.NOT_REQUIRED]: "Not required",
  [ProposalEthicsStatus.APPROVED]: "Existing approval covers it",
  [ProposalEthicsStatus.AMENDMENT_NEEDED]: "Amendment needed",
  [ProposalEthicsStatus.NEW_APPLICATION_NEEDED]: "New application needed",
} as const

export const ProposalTag = {
  ASSESSMENT: "assessment",
  QUANTITATIVE: "quantitative",
  QUALITATIVE: "qualitative",
  TEAMWORK: "teamwork",
  INDUSTRY: "industry",
  CURRICULUM: "curriculum",
  GENERATIVE_AI: "generativeAi",
  ETHICS: "ethics",
} as const

export type ProposalTag = (typeof ProposalTag)[keyof typeof ProposalTag]

export const ProposalTagLabels: Record<ProposalTag, string> = {
  [ProposalTag.ASSESSMENT]: "Assessment",
  [ProposalTag.QUANTITATIVE]: "Quantitative",
  [ProposalTag.QUALITATIVE]: "Qualitative",
  [ProposalTag.TEAMWORK]: "Teamwork",
  [ProposalTag.INDUSTRY]: "Industry",
  [ProposalTag.CURRICULUM]: "Curriculum",
  [ProposalTag.GENERATIVE_AI]: "Generative AI",
  [ProposalTag.ETHICS]: "Ethics",
} as const

export const ProposalTimeframeStartPeriod = {
  SEM_1: "sem1",
  SEM_2: "sem2",
  SUMMER: "summer",
} as const

export type ProposalTimeframeStartPeriod =
  (typeof ProposalTimeframeStartPeriod)[keyof typeof ProposalTimeframeStartPeriod]

export const ProposalTimeframeStartPeriodLabels: Record<ProposalTimeframeStartPeriod, string> = {
  [ProposalTimeframeStartPeriod.SEM_1]: "Semester 1",
  [ProposalTimeframeStartPeriod.SEM_2]: "Semester 2",
  [ProposalTimeframeStartPeriod.SUMMER]: "Summer",
} as const

export const ProposalTimeframeEndPeriod = {
  EARLY: "early",
  MID: "mid",
  LATE: "late",
} as const

export type ProposalTimeframeEndPeriod =
  (typeof ProposalTimeframeEndPeriod)[keyof typeof ProposalTimeframeEndPeriod]

export const ProposalTimeframeEndPeriodLabels: Record<ProposalTimeframeEndPeriod, string> = {
  [ProposalTimeframeEndPeriod.EARLY]: "Early",
  [ProposalTimeframeEndPeriod.MID]: "Mid",
  [ProposalTimeframeEndPeriod.LATE]: "Late",
} as const
