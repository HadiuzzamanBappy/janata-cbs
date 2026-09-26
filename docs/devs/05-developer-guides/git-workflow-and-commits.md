# 📝 Git Workflow & Commit Conventions

## 1. Executive Summary & Purpose
This document specifies Git branching rules, commit message conventions, pre-commit validation hooks, and PR guidelines for `finx-ui`.

Commit messages are automatically validated by `@commitlint/cli` and `husky`. Invalid commit messages will be rejected by git hooks.

---

## 2. Commit Message Structure

Every commit message **MUST** adhere to the standard Conventional Commits format:

```text
<type>(<scope>): <summary in imperative mood, ≤72 chars, no trailing period>

[body: optional explanation of WHY, not WHAT]
[footer: optional ticket reference, e.g. Refs: CBS-123]
```

---

## 3. Allowed Commit Types & Scopes

### Commit Types
| Type | Allowed Use Case | Example |
| :--- | :--- | :--- |
| `feat` | New user-facing feature or screen capability | `feat(loans): add repayment schedule grid` |
| `fix` | Bug fix or exception correction | `fix(auth): redirect to login on 401 token expiry` |
| `refactor` | Code change that neither fixes a bug nor adds a feature | `refactor(engine): extract control renderer from field factory` |
| `perf` | Performance optimization | `perf(forms): cache schema in memory` |
| `style` | Formatting or CSS adjustments (no logic change) | `style(dashboard): fix tab overflow padding` |
| `docs` | Documentation changes | `docs: update menu config format` |
| `test` | Adding or updating unit/e2e tests | `test(transfers): reject same-account transfer` |
| `build` | Build system, pnpm dependencies, or bundler changes | `build: upgrade next to v16` |
| `ci` | CI/CD pipeline script adjustments | `ci: add lint step` |
| `chore` | Workspace maintenance or code cleanup | `chore: remove legacy syscomp files` |

### Allowed Scopes
`auth` · `dashboard` · `menu` · `forms` · `customer` · `accounts` · `loans` · `deposits` · `transfers` · `api` · `store` · `ui` · `config`

---

## 4. Mandatory Commit Rules (MUST / MUST NOT)

### Mandatory Rules (MUST)
- **MUST** use imperative mood in summaries (`add`, not `added` or `adds`).
- **MUST** keep summary line under 72 characters with no trailing period.
- **MUST** run linting and type checking before committing.

### Prohibited Rules (MUST NOT)
- **MUST NOT** use vague commit summaries (`wip`, `fix stuff`, `changes`).
- **MUST NOT** combine multiple unrelated logical changes into a single commit.

---

## 5. Verification Criteria

To verify commit linting:
```bash
npx commitlint --from=HEAD~1
```

---

## 6. Affected Documentation Updates
When modifying commit rules or branching strategies, update:
- [docs/05-developer-guides/git-workflow-and-commits.md](file:///d:/Work/React/cbs/finx-ui/docs/05-developer-guides/git-workflow-and-commits.md)
- [AGENTS.md](file:///d:/Work/React/cbs/finx-ui/AGENTS.md)
