---
name: scaffold-domain-feature
description: Use this skill when the user asks to create a brand new domain feature (e.g. Inquiries, Auth, System Config) that strictly follows the project's Domain-Driven Design layout.
---

# 🚀 Skill: Scaffold Domain Feature

Use this runbook to assemble a new feature domain from scratch while strictly adhering to the Next.js App Router and Domain-Driven limitations.

## 🛑 Pre-Flight Checks
1. **Identify Domain**: Ask the user what the domain name is (e.g., `reporting`, `auth`, `inquiries`).

## 🛠️ Execution Steps

### Step 1: Create the Domain Directory
Create a new folder in `src/features/<domain-name>/`.
Do NOT create this in the global `src/components/` folder.

### Step 2: Scaffold the Core Files
Generate the foundational files for this feature domain. Every domain should ideally have:
- `index.tsx`: The main entry component (max 300 lines).
- `schema.ts`: Zod validation schemas specific to this domain's data.
- `actions.ts`: Any Next.js Server Actions required by this domain.
- `hooks/use-<domain>.ts`: Custom React hooks for local state management.

### Step 3: Enforce Boundaries
- The main `index.tsx` should default to a React Server Component unless it absolutely requires interactive state, in which case it should be marked with `"use client"`.
- Ensure all Server Actions in `actions.ts` are marked with `"use server"`.
- Do not import `server-only` global config files into client components.

### Step 4: Verify Formatting
Ensure the UI uses standard `shadcn/ui` components imported from `src/components/ui/` and styled with Tailwind OKLCH variables.
