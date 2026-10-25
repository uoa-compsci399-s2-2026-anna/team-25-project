import type { MemberOption, MemberSearch } from "./member-picker"

export const sampleMembers: MemberOption[] = [
  {
    id: 1,
    firstName: "Ada",
    lastName: "Lovelace",
    position: "Senior Lecturer",
    institution: "University of Auckland",
  },
  {
    id: 2,
    firstName: "Alan",
    lastName: "Turing",
    position: "Professor",
    institution: "University of Otago",
  },
  {
    id: 3,
    firstName: "Grace",
    lastName: "Hopper",
    position: "Lecturer",
    institution: "Massey University",
  },
  {
    id: 4,
    firstName: "Edsger",
    lastName: "Dijkstra",
    position: "Tutor",
    institution: "University of Auckland",
  },
]

/** Matches names in memory after a short delay, like the real server search. */
export const searchSampleMembers: MemberSearch = (query) =>
  new Promise((resolve) =>
    setTimeout(() => {
      const text = query.toLowerCase()
      resolve(
        sampleMembers.filter((member) =>
          `${member.firstName} ${member.lastName}`.toLowerCase().includes(text),
        ),
      )
    }, 300),
  )
