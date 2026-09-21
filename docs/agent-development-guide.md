# 🧠 The Developer's Guide to AI Customization (`.agents`)

This document is your manual for interacting with and customizing the Antigravity AI assistant for the `finxui-ref` project. 

By mastering the `.agents` folder, you stop treating the AI like a generic chatbot and turn it into a senior engineer that strictly follows your enterprise architecture.

---

## 1. How the AI Reads Your Project
When you open this project in the Antigravity IDE, the AI automatically scans your workspace. However, **it does not read every single file** in your repository. It specifically looks for a folder named `.agents/` at the root of your project.

Anything placed inside `.agents/` becomes the absolute "law" for the AI.

---

## 2. Rules vs. Skills (The Two Pillars)

To keep the AI fast and prevent it from hallucinating, you must understand the difference between a **Rule** and a **Skill**.

### A. Rules (`.agents/rules/*.md`)
**What they are:** Passive, always-on architectural constraints.
**How they work:** Every single time you ask the AI a question or tell it to write code, all the files in the `rules/` directory are silently injected into its memory. 
**When to use them:** Use rules to enforce things the AI should *never* do, or patterns it should *always* follow.
- *Good Rule:* "Never use the `any` type in TypeScript."
- *Good Rule:* "All database connections must use `import "server-only"`."
- *Bad Rule:* "Here is a 20-step tutorial on how to build a login screen." (This is too bloated for an always-on rule).

**Best Practice:** Keep rules short, bulleted, and split them logically by domain (e.g., `01-architectural-boundaries.md`, `02-nextjs-app-router.md`).

### B. Skills (`.agents/skills/<skill-name>/SKILL.md`)
**What they are:** Active, on-demand runbooks for complex workflows.
**How they work:** Skills are **Progressively Disclosed**. The AI only knows the *names* of the skills initially. If you explicitly ask the AI to "Run the migration skill," it will fetch that specific file, read the massive 20-step tutorial inside, and execute it.
**When to use them:** Use skills for multi-step procedures (like scaffolding a new feature, wiring a gRPC endpoint, or migrating legacy code).

**Best Practice:** The most important part of a skill is its `description` in the YAML frontmatter at the top of the file. The AI uses this description to figure out if it should activate the skill.
```markdown
---
name: migrate-legacy-component
description: Use this skill when the user asks to migrate an old component to the new Domain-Driven structure.
---
```

---

## 3. Automation (Hooks)

The `.agents/hooks.json` file is a powerful tool to ensure code quality. 

**How it works:** You can define CLI commands that the AI must run immediately after it finishes editing your code.
**Example:** If you configure `"pnpm eslint --fix {{files}}"`, the AI will write the code, save it, and then automatically trigger your linter on those specific files. If the linter fails, you know the AI messed up.

---

## 4. The Golden Rule of AI Customization
> **If the AI makes a systemic mistake, do not just fix the code. Fix the `.agents` folder.**

If you notice the AI keeps trying to fetch data directly from the client instead of using a Server Action, don't just correct it in chat. Go into `.agents/rules/02-nextjs-app-router.md` and add a bullet point: *"Never fetch data from the client; always use Server Actions."*

By treating the `.agents` folder as a living document, the AI gets smarter every single day and will never make the same mistake twice.

---

## 5. Evolution Strategy: Phase 1 vs. Phase 2

Your `.agents` folder is designed to evolve alongside your project. It should reflect the **current** constraints of your codebase.

### Current State: Phase 1 (The Refactor)
Right now, your AI is strictly configured as a "Migration Engine". 
- **The Rules** strictly forbid Next.js `<Link>` routing, force Zod parsing, and enforce the 300-line file limit.
- **The Skills** (`migrate-legacy-component`, `wire-grpc-proxy`, `scaffold-domain-feature`) are solely focused on safely translating old monolithic React into the new BFF architecture and routing it through `/api/proxy`.

### Future State: Phase 2 (New Feature Development)
Once the legacy code is completely deleted and you begin building *new* features, you must **remake** this `.agents` folder:
1. **Delete the Migration Skill**: The `migrate-legacy-component` skill will be obsolete. Delete it to keep the AI focused and fast.
2. **Add Modern Data Skills**: In Phase 2, you will likely migrate away from `/api/proxy` to proper **Next.js Server Actions** (as noted in `docs/future-architecture-upgrades.md`). At that time, you should create a `create-server-action` skill. (If you created it now, the AI would get confused and try to build Server Actions during your Phase 1 proxy).
3. **Update UI Constraints**: When you integrate `react-hook-form` in Phase 2, you must add a new rule to `04-domain-driven-design.md` enforcing its use over your custom form state reducer.

Always keep the `.agents` folder ruthlessly aligned with exactly what you are working on *today*.
