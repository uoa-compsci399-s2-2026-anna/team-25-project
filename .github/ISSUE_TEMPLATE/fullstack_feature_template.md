---
name: Full-stack feature template
about: Features spanning both `apps/backend` and `apps/frontend`
title: "[FULLSTACK] "
type: Feature
labels: fullstack
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

- [ ] API Routes are annotated with OpenAPI/Scalar
- [ ] Code generation run (_hint_: `pnpm types:generate`)
- [ ] Storybooks created for relevant components
- [ ] Tests written for services and critical interactions with [Vitest](https://vitest.dev/)
- [ ] Appropriate mocks created where possible
- [ ] PR Reviewed
- [ ] Changes tested after rebasing on main or merging in main (_hint_: `git fetch origin main`, then `git rebase main` or `git merge main`)
- [ ] All required PR checks passing
