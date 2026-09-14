# AI Customization Strategy (`.agents`)

> **Purpose:** This document outlines the roadmap for configuring the AI pair programmer (Antigravity/Gemini) to become a specialized expert on the `finxui-ref` enterprise architecture.

By incrementally building out the `.agents/` folder at the root of the project, you teach the AI the project's specific coding standards, workflows, and integrations, preventing it from hallucinating outdated or generic solutions.

---

## 1. Current State: Minimal Foundation (Rules)

We have started with a minimal setup that ensures baseline code quality.

**Current Structure:**
```text
.agents/
└── rules/
    ├── 01-strict-coding-style.md   # Bans 'any', enforces Tailwind v4/Zustand
    └── 02-refactoring-workflow.md  # Enforces feature-parity and checklist usage
```

**How it works:** 
Every time a new AI session starts, these markdown files are silently injected into the AI's system prompt. This guarantees the AI never forgets the project's core philosophies.

---

## 2. Phase 2: Teaching Workflows (Skills)

As the project grows, repetitive tasks will emerge (e.g., creating a new dynamic form, adding a new Redux/Zustand store, or wiring up a gRPC endpoint). Instead of explaining these tasks manually every time, you will create **Skills**.

**Target Structure:**
```text
.agents/
├── rules/
│   └── ...
└── skills/
    ├── create-new-screen/
    │   └── SKILL.md                 # Explains the 5-step process to scaffold a new FinXUI Screen
    └── wire-grpc-endpoint/
        └── SKILL.md                 # Explains how to generate and wire a new gRPC protobuf service
```

**How it works:** 
Skills are loaded *on-demand*. You can tell the AI: *"Run the `create-new-screen` skill for the User Management page"*, and the AI will execute your exact proprietary workflow perfectly.

---

## 3. Phase 3: Total Automation (Hooks & Integrations)

For a fully mature enterprise project, the AI should be deeply integrated into the developer environment and external services.

**Target Structure:**
```text
.agents/
├── rules/
├── skills/
├── hooks.json         # Automatically runs `pnpm typecheck` or `prettier` after the AI writes code
└── mcp_config.json    # Connects the AI to external tools (Jira, GitHub, PostgreSQL)
```

**How it works:**
- **Hooks** guarantee quality. The AI can trigger your local test suites to prove its code works before handing control back to you.
- **MCP Servers** give the AI secure backend access. You can say *"Fix the bug described in Jira ticket CBS-999"*, and the AI will fetch the ticket via the MCP integration, find the bug in the code, and fix it.

---

## Best Practices Checklist

- [ ] **Commit `.agents` to Git**: Always check the `.agents/` folder into version control so your entire engineering team shares the exact same AI rules and workflows.
- [ ] **Keep Rules Concise**: Do not dump 100 pages of rules into `.agents/rules`. The AI has a finite context window. Keep rules bulleted and actionable.
- [ ] **Evolve Incrementally**: When you correct the AI for making a systemic mistake (e.g., using a banned internal API), don't just fix the code. **Add a new rule** to `.agents/rules` so it never makes that mistake again. 
