# Project Roadmap — From First Run to Full Understanding

This roadmap takes a developer through the Janata CBS Workbench in the order the system actually works: from running it offline, through the layer rules and the banking vocabulary, to following one command (`ACCOUNT I 1001`) from the keyboard to the core and back. Each level lists **what to read, in order**, the **one idea to take away**, and an **exercise** that proves you've understood it.

> [!NOTE]
> Source files are named by their path from the repository root. Open them in your editor; links in this portal point only to other portal pages.

| Level | Topic                                 | Time  |
| ----- | ------------------------------------- | ----- |
| 0     | Run it offline                        | 1 h   |
| 1     | Layer rules                           | 1 h   |
| 2     | Banking vocabulary                    | 2 h   |
| 3     | Login & session                       | 2 h   |
| 4     | Command → screen                      | 3 h   |
| 5     | Request path (the core of the system) | 4 h   |
| 6     | Schema-driven forms                   | 4 h   |
| 7     | Inquiries & action buttons            | 3 h   |
| 8     | Popups & multiple windows             | 3 h   |
| 9     | Admin designers                       | 2 h   |
| 10    | Final exercise                        | 1 day |

Levels 5 and 6 are the heart of the project. If you only have time for two levels, do those.

---

## Level 0 — Run It Offline

**Read:** `README.md` → `AGENTS.md` → `CLAUDE.md` → [Project Tree](PROJECT_TREE.md)

**Take away:** the Workbench is a presentation layer plus a thin server-side proxy (a BFF). All banking logic, ledgers and settlement stay in the Java core. The browser talks only to `/api/proxy`.

**Exercise:**

1. Copy `.env.example` to `.env.local` and keep `DATA_SOURCE=static` and `CACHE_ENABLED=false`. In this mode no core, Redis or network is needed.
2. Run `pnpm install`, then `pnpm dev`, and sign on with one of the users in `mock/db/SC_USER.ts`.
3. Open a few screens, then run `pnpm verify:all` and read the summary.

**Background:** Next.js 16 App Router (read the guide in `node_modules/next/dist/docs/`, since this version differs from older tutorials), React 19, TypeScript strict mode.

---

## Level 1 — Layer Rules

**Read:** `.agents/rules/01-architecture-layers.md`, then the `LAYERS` table in `scripts/verify/verify-layers.ts`.

**Take away:** imports only point downward:

```text
app → features → components → hooks → store → lib/cbs-*, core-utils → lib/infra-*, core-config, core-logger, data-parsers → types, data-schemas
```

Every unit is imported through its `index.ts` (or `server.ts` for server-only code), never by a deep path. Once you know the ranks, you can guess where any piece of code lives.

**Exercise:** in a feature file, add an import that points upward on purpose (for example, `@/features/...` from inside `src/lib`). Run `pnpm verify:layers`, read the error, then undo it.

---

## Level 2 — Banking Vocabulary

**Read:** `src/types/access.ts`, `src/types/status.ts`, `src/types/screen.ts`, then skim `src/lib/data-schemas/`.

**Take away:**

- **RIDASHL** is the set of record functions and of user rights: **R**everse, **I**nput, **D**elete, **A**uthorize, **S**ee, **H**old, **L**ist.
- **Record statuses:** `New Draft` → `Pending Approval` (UA) → `Authorized` (AU), plus `Held`, `Reversed` and `Deleted`.
- **Four-Eyes (maker-checker):** the person who entered or changed a record can never authorize it.
- Everything crossing a boundary is a Zod schema, and its TypeScript type is derived with `z.infer`.

**Exercise:** explain `ACCOUNT I 1001` in words: control `ACCOUNT`, function `I` (input), record `1001`.

**Background:** Zod 4 (`safeParse`, `z.infer`, `.catch`).

---

## Level 3 — Login & Session

**Read:** `src/proxy.ts` (route guard) → `src/app/(auth)/login/page.tsx` → `src/features/auth/` → `src/app/api/login/route.ts` → `src/app/api/session/route.ts` → `src/store/session/`

**Take away:** the session lives in Redis on the server, and the browser holds only a cookie. User and branch are always read from the server session, never trusted from the client. A first sign-on (`initLogin`) is sent to `/change-password` before anything else works.

**Exercise:** draw the sign-on sequence on paper: form → `/api/login` → core (or mock) → session → redirect.

---

## Level 4 — Command → Screen

**Read:** `src/lib/cbs-command/README.md`, then `src/lib/cbs-command/` (`engine/` → `registry/` → `executor/`) → `src/features/workbench/registry.tsx` (`resolveScreen`) → `src/store/workbench/` → `src/components/layout/workbench-shell.tsx`

**Take away:**

- Every screen opens from a command string, typed in the search palette (`Ctrl+K`) or run by the menu or an inquiry row.
- `resolveScreen()` checks, in order: alias → bespoke screen (`BESPOKE_SCREENS`) → `INQ` prefix (`OpsInquiry`) → everything else (`OpsForm`).
- `lib` code can't import the store (that would be an upward import), so it notifies through `registerCommandAdapter`.

**Exercise:** put a breakpoint in `resolveScreen` and run three kinds of command: `SC.MENU.DESIGN`, `INQ GET.EMP.INFO` and `ACCOUNT I 1001`.

**Background:** Zustand 5 (vanilla stores + React context providers).

---

## Level 5 — Request Path

This is the most important level. Read the files in the order a request travels:

1. `src/lib/cbs-client/` (`payloads/` → `transport/proxy-client.ts`): the browser builds a typed request and `POST`s it to `/api/proxy`. Failures toast exactly once, here.
2. `src/app/api/proxy/route.ts`: session check (401 / 403) → Zod check of the body → server-side rights check (`verifyUserRecordAccess`, plus `verifyZeroAuthAccess` for level-0 mutations) → envelope built from the session → cache → dispatch → decode once.
3. `src/lib/cbs-access/`: the RIDASHL and Four-Eyes rules. The UI uses all of them; the proxy checks rights on every request, and Four-Eyes on every authorize by reading the pending record first. Read the "What the server checks" section of its README.
4. `src/lib/infra-redis/cache.ts`: read-through cache, and invalidation after a successful mutation.
5. `src/lib/infra-grpc/dispatch.ts` → `client.ts`: gRPC to the core in live mode, the in-memory simulator in static mode.
6. `proto/service.proto`: the contract with the Java core. Stubs are generated with `pnpm proto:gen` and never edited by hand.
7. `mock/core/` → `database-router.ts` → `mock/db/`: the offline stand-in for the core, with tables named after the real CBS tables.

**Take away:** the browser is never trusted. Every value that matters (user, branch, rights) is checked again on the server, and every response is decoded once on the server.

**Exercise:** add a `logger.debug` call at each of the seven steps, open `ACCOUNT I 1001` and watch the request travel in the terminal. Remove the logs afterwards.

**Background:** TanStack Query v5, gRPC/Protobuf basics, Redis basics.

---

## Level 6 — Schema-Driven Forms

**Read:** `mock/db/SC_MODEL_CONFIG.ts` and `mock/db/SC_FORM_CONFIG.ts` (raw specs) → `src/lib/cbs-form-spec/README.md` and `compile.ts` (spec → layout) → `src/components/cbs-form-engine/README.md` (rendering) → `src/lib/cbs-record/` (deltas and status changes) → `src/features/operations/forms/ops-form.tsx`

**Take away:**

- No banking screen is hand-coded. **Model Config** is the data schema and **Form Config** is the presentation, and `compileFormSpec()` joins them into what the engine renders.
- If a form renders wrong, fix the compiler or the engine, never one screen.
- Typed values stay local to the field and are pushed to the shared store only when needed, so typing doesn't re-render the form. Saves send only the fields that changed (deltas).

**Exercise:** change a field's label and column width in the mock `SC_FORM_CONFIG` and watch the screen change.

**Background:** Tailwind CSS v4 semantic tokens, the 12-column grid and compact density (`.agents/skills/cbs-compact-ui-and-layout`).

---

## Level 7 — Inquiries & Action Buttons

**Read:** `src/lib/cbs-inquiry-spec/README.md` → `src/components/cbs-inquiry-engine/README.md` → `src/features/operations/inquiries/ops-inquiry.tsx` → `src/lib/cbs-screen/action-bar.ts`

**Take away:** an inquiry is a config record too: columns, filters and row commands. The action bar decides which buttons are enabled from RIDASHL rights, the record status and Four-Eyes, and it always gives a reason when a button is disabled.

**Exercise:** sign on as the user who entered a record and try to authorize it. Find where the button is disabled and where the Four-Eyes message comes from (`src/lib/cbs-access/record-guard.ts`).

---

## Level 8 — Popups & Multiple Windows

**Read:** `src/lib/cbs-screen/workbench-bus.ts` → `src/features/workbench/standalone-screen.tsx` → `src/store/workbench/workbench-provider.tsx` → `src/hooks/use-idle-timeout.ts` → `src/hooks/use-single-tab.ts`

**Take away:**

- A tab can be popped out into its own window (`/screen/[id]`) and docked back.
- Drafts travel through sessionStorage, never in the URL, and are cleared only after the tab has docked.
- Windows talk over a `BroadcastChannel`, and every message is validated when it arrives.
- Only the main window runs the idle-timeout watcher, and only one main tab may be active at a time.

**Exercise:** pop a screen out, type into it, dock it back, and follow the draft from start to finish.

---

## Level 9 — Admin Designers

**Read:** `src/features/system/` (menu designer, model config, form config, inquiry config).

**Take away:** these bespoke screens author the specs that Levels 6 and 7 render. They are the only screens with hand-written layouts, and they are registered in `BESPOKE_SCREENS`.

**Background:** `@dnd-kit` (the designers' drag-and-drop canvases).

---

## Level 10 — Final Exercise: Build a Screen Offline

Build a new form screen end to end with no backend, for example `FX.TRADE`:

1. **Model:** add its model to `mock/db/SC_MODEL_CONFIG.ts` (fields, types, `PREFIX` and `TABLENAME`).
2. **Form:** add its layout to `mock/db/SC_FORM_CONFIG.ts`.
3. **Table:** add a data table file in `mock/db/` (follow `FT_FUNDS_TRANSFER.ts`), export it from `mock/db/index.ts` and register it in `CBS_PHYSICAL_TABLES`.
4. **Control:** add the control to `mock/db/SC_CONTROL.ts`, and add a menu entry in `mock/db/SC_MENU_TREE.ts` if it should appear in the sidebar.
5. **No registry entry:** form screens resolve to `OpsForm` automatically. Only bespoke screens go in `BESPOKE_SCREENS`.
6. **Check:** open it with `Ctrl+K` → `FX.TRADE`. Confirm that fields follow the 12-column grid, that amounts use the monospace format, that a save sends only changed fields, and that Four-Eyes blocks you from authorizing your own record.
7. **Gates:** `pnpm verify:mock`, then `pnpm lint:fix`, `pnpm typecheck` and `pnpm verify:all`.

When you can do this without help, and explain why each gate exists, you understand the project.
