# Strict Coding Standards

These rules MUST be followed at all times during the development of `finxui-ref`.

## 1. Type Safety (Zero Tolerance)
- NEVER use the `any` type. If a type is unknown, use `unknown` and narrow it down.
- NEVER use `@ts-ignore`. Fix the underlying type issue.
- All props and state must have explicit interfaces or types.

## 2. Component Architecture
- Default to **React Server Components (RSC)**. Only use `"use client"` when absolutely necessary (e.g., interactivity, hooks like `useState` or `useStore`).
- Do not modify third-party components (like `shadcn` or `use-mobile.ts`). If they have lint errors, add them to `globalIgnores` in `eslint.config.mjs` instead of mutating the source.

## 3. State Management
- No prop-drilling.
- Use **Zustand** for global client state (e.g., sessions, workbench tabs, alerts).
- Zustand stores must be strictly typed and contain zero `any` types.

## 4. UI & Styling
- Use **Tailwind v4** with OKLCH variables (defined in `globals.css`).
- Do not use inline styles.
- Components must be deeply integrated with the `next-themes` dark mode wrapper to prevent flashing.
