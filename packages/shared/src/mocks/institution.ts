import type { Institution } from "../payload-types"

export const mockInstitution = (overrides: Partial<Institution> = {}): Institution => ({
  id: 1,
  name: "University of Auckland",
  country: "NZ",
  domains: [{ domain: "auckland.ac.nz" }],
  logo: null,
  showLogo: false,
  updatedAt: "",
  createdAt: "",
  ...overrides,
})
