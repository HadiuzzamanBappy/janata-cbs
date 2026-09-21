---
name: migrate-legacy-component
description: Use this skill when the user asks to migrate an old monolithic React component from the legacy syscomp folder to the new FinXUI Domain-Driven structure.
---

# 🚀 Skill: Migrate Legacy Component (Phase 1)

This runbook defines the exact procedure for migrating an old `finxui` component to the new `finxui-ref` architecture. Do not skip any steps.

## 🛑 Pre-Flight Checks
1. **Locate Target**: Ask the user for the exact name or path of the legacy file to migrate (if not provided).
2. **Review Tracker**: Check `docs/legacy-src-checklist.md` to ensure the file is not already marked as migrated (`[x]`). Mark it as in-progress (`[/]`).

## 🛠️ Execution Steps

### Step 1: Read the Source
Read the entire source of the legacy file using your file viewer tools. Pay attention to:
- State logic (useState, useEffect).
- API calls (must be routed to `/api/proxy`).
- Custom UI elements that need to be replaced with `shadcn/ui`.

### Step 2: Extract & Decompose (The 300-Line Limit)
The old components are often monolithic. You MUST break them apart into atomic files.
- Place all domain-specific logic and smart wrappers into `src/features/<domain-name>/`.
- Example: `INQ.tsx` becomes `src/features/inquiries/inquiry-engine.tsx`, `inquiry-filters.tsx`, etc.
- No single component file can exceed 300 lines. Extract sub-components if it does.

### Step 3: Implement Strict Boundaries
- **No gRPC on Client**: Do NOT import `@grpc/grpc-js` or any `server-only` code into the UI components.
- Ensure all mutations hit `/api/proxy` or Server Actions.
- Ensure Zod validation (`.parse()`) is applied to data crossing the boundary.

### Step 4: Map Legacy Controls to Shadcn
Replace all legacy elements with their standardized equivalents:
- `MessageBox.tsx` / `PopUp.tsx` ➔ Shadcn `<Dialog>`
- `SCDate.tsx` ➔ `components/ui/date-picker.tsx`
- `SCComboBox.tsx` ➔ `components/ui/select.tsx`
- `DataListView.tsx` ➔ `components/ui/data-table.tsx`

### Step 5: Enforce Layout Constraints
- **Workspace Navigation Ban**: Do NOT use Next.js `<Link>` for screen navigation. Use the workspace command dispatcher.
- Apply `w-full flex-1` and `size="sm"` to banking forms to preserve high-density layouts.

## ✅ Post-Flight Tracker Update
Once the files are written and the code builds cleanly:
1. Open `docs/legacy-src-checklist.md`.
2. Find the entry for the migrated file.
3. Change `[/]` to `[x]` (e.g. `[x] SC.INQUIRY.tsx (Migrated to features/inquiries/inquiry-engine-v2.tsx)`).
4. Record the milestone in the Daily Log section of `docs/refractor-checklist.md`.
