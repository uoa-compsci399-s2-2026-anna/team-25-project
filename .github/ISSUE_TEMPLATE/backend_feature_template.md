---
name: Backend feature template
about: Features relating to Payload / the server side of `apps/web`
title: "[BACKEND] "
type: Feature
labels: backend
assignees: ""
---

**Is your feature request related to a problem? Please describe.**
<!-- A clear and concise description of what the problem is. Ex. I'm always frustrated when [...] -->

**Describe the solution you'd like**
<!-- A clear and concise description of what you want to happen. -->

_Acceptance Criteria_
<!-- Define the acceptance criteria for the feature -->

- [ ] ...

**Additional context**
<!-- Add any other context or screenshots about the feature request here. -->

**BEFORE MERGING**

- [ ] Tests written for services using [Vitest](https://vitest.dev/)
- [ ] API Routes are annotated with OpenAPI/Scalar
- [ ] Appropriate mocks created where possible
- [ ] Code generation run (_hint_: `pnpm types:generate`)
- [ ] PR Reviewed
- [ ] Changes tested after rebasing on main or merging in main (_hint_: `git fetch origin main`, then `git rebase main` or `git merge main`)
- [ ] All required PR checks passing
