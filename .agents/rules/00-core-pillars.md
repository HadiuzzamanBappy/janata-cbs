# 00: Core Pillars

The gates, invariants and architecture map are in `AGENTS.md`. This file holds the detail behind them. The system runs in **production** for bank operators: breaking an open session, a stored draft or the core contract is an incident.

## 1. Compatibility boundaries

Zero legacy applies **inside the code**: no shims, deprecated aliases, fallback wrappers, dual params or obsolete types. Update every call site in the same change. Three things outlive a deploy and must stay compatible or ship a one-time migration. **Flag any change to them to the owner before merging:**

1. **Persisted browser data**: shapes written through `cbsStorage` and the persisted stores (`WorkbenchTab.formData` / `baseline`, session state, staged popup drafts).
2. **Core wire contract**: `proto/service.proto`, request types, control names, record field names.
3. **Operator-facing addresses**: command strings and aliases (`MD`, `ACCOUNT I 1001`), menu commands, `/screen/...` URLs.

## 2. Domain rules

- **Four-Eyes**: the record's inputter never authorizes it. Enforced only in the UI (`evaluateCbsAccess`); `/api/proxy` checks rights only (`verifyUserRecordAccess`). Never claim or assume server-side Four-Eyes.
- **Append-only schema**: a committed Model Config property is never deleted; only properties added in the current draft may be removed (`removeDraftField`).
- **RIDASHL**: every action button's state comes from `useCbsAccess()` / `resolveCbsActionBar()`.
- **1:1 data**: in-memory state matches the wire shape (`PROP: [...]` stays a recursive tree, with no flattening).
- **Cross-window messages** use `CBS_SCREEN_MESSAGE` names and are validated on receipt.
- **Storage keys** are declared in `clientConfig.storage` / `clientConfig.auth` and accessed only through `cbsStorage`.

## 3. Form state

Keystrokes never re-render the workbench. Form values live in one place: `useCbsPersistence` holds `formData` for the screen, so a keystroke re-renders the form only, and it writes `formData` and `isDirty` to the tab debounced by 400 ms.

## 4. Naming & UI

- Files and folders `kebab-case`; components and types `PascalCase` (types `readonly`); constants and enums `UPPER_SNAKE_CASE`; config singletons `camelCase`; hooks `use*`.
- No filler text: clear labels, tooltips or the validation drawer for help, keyboard-first (F-keys, command gateway), no layout shift. Details: the `cbs-compact-ui-and-layout` skill.

## 5. Refactoring checklist (any file you touch)

The rules are in `AGENTS.md` §1 (DRY, zero legacy, dead code, magic strings, IDs, size budget). This adds the detail:

1. **No duplicate logic**: never compute `isReadOnly` or maker ≠ checker inline (`@/lib/cbs-access`), never diff records by hand (`evaluateDirty` / `computeDelta`), never add raw `keydown` listeners (`useCbsHotkeys` / `useHotkeys`).
2. **Zero legacy stops at §1**: the compatibility boundaries above are the only exception. There, old shapes stay readable or get a one-time migration.
3. **Magic strings** include sets of modes: build them from `@/types` enums, not inline arrays.
4. **IDs**: if `GNI` allocation fails with no candidate, return `""`. UI-only keys use `generateClientToken()` and are never sent as record IDs.
