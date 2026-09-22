# Git Commit Convention — CBS Frontend

Format (enforced by commitlint + husky — invalid commits are rejected):

```
<type>(<scope>): <summary in imperative mood, ≤72 chars, no period>

[body: why, not what — optional]
[footer: Refs: JIRA CBS-123 / BREAKING CHANGE: — optional]
```

## Types

| Type | Use for | Example |
|---|---|---|
| `feat` | New feature | `feat(loans): add repayment schedule grid` |
| `fix` | Bug fix | `fix(auth): redirect to login on 401 token expiry` |
| `refactor` | No behavior change | `refactor(api): migrate to tanstack-query` |
| `perf` | Performance | `perf(forms): cache schema in IndexedDB` |
| `style` | CSS/format only | `style(dashboard): fix tab overflow` |
| `docs` | Documentation | `docs: update menu config format` |
| `test` | Tests | `test(transfers): reject same-account transfer` |
| `build` | Deps, bundler | `build: upgrade vite to v7` |
| `ci` | Pipeline | `ci: add lint step` |
| `chore` | Maintenance, cleanup | `chore: remove legacy components` |
| `revert` | Undo a commit | `revert: feat(loans)` |

Old prefixes → new: `FEAT/UI/DATA → feat`, `STRUCT/AGNT → refactor/chore`, `INFRA/CFG → build/ci/chore`, `Docs/Chore → docs/chore`.

## Scopes

`auth` · `dashboard` · `menu` · `forms` · `customer` · `accounts` · `loans` · `deposits` · `transfers` · `api` · `store` · `ui` · `config`

## Examples

```
feat(dashboard): add keep-alive for embedded tabs
fix(forms): restore autosaved draft after refresh
feat(menu): support open-in-new-tab from context menu

fix(auth): propagate logout to all tabs

Session in one tab must invalidate all others via
BroadcastChannel.

Refs: JIRA CBS-214
```

## Rules

- One logical change per commit.
- Imperative mood: `add`, not `added`. No trailing period.
- Body explains **why**; footer links ticket.
- Never: `wip`, `fix stuff`, `changes`, vague summaries, mixed changes in one commit.

## Setup (one-time)

```bash
npm i -D @commitlint/cli @commitlint/config-conventional husky
echo "module.exports = { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
npx husky init
echo 'npx --no -- commitlint --edit $1' > .husky/commit-msg
```
