import {
  Code,
  Folder,
  RefreshCw,
  Server,
  Shield,
  Terminal,
} from "lucide-react";
import type { NavGroup } from "./types";

export const DEV_NAV_GROUPS: NavGroup[] = [
  {
    id: "00-refactor",
    title: "00. Refactoring Progress",
    icon: RefreshCw,
    items: [
      {
        label: "Master Audit Plan",
        href: "/devs/00-refractor/refractor",
        keywords: ["refractor", "plan", "inventory", "syscomp", "migration"],
      },
      {
        label: "Refactoring Checklist",
        href: "/devs/00-refractor/refractor-checklist",
        keywords: ["checklist", "progress", "refactor", "status"],
      },
      {
        label: "Legacy Src Checklist",
        href: "/devs/00-refractor/legacy-src-checklist",
        keywords: ["legacy", "syscomp", "src", "checklist"],
      },
      {
        label: "Future Architecture Upgrades",
        href: "/devs/00-refractor/future-architecture-upgrades",
        keywords: ["future", "upgrades", "roadmap", "debt"],
      },
      {
        label: "AI Agent Development Guide",
        href: "/devs/00-refractor/agent-development-guide",
        keywords: ["agent", "ai", "guide", "antigravity", "skills"],
      },
    ],
  },
  {
    id: "01-architecture",
    title: "01. Architecture & Security",
    icon: Shield,
    items: [
      {
        label: "Overview & Topology",
        href: "/devs/01-architecture/overview",
        keywords: ["topology", "bff", "3-tier", "gRPC", "architecture"],
      },
      {
        label: "Folder Structure & DDD",
        href: "/devs/01-architecture/folder-structure",
        keywords: ["ddd", "barrel", "colocation", "features"],
      },
      {
        label: "Security & Secrets",
        href: "/devs/01-architecture/security-and-secrets",
        keywords: ["server-only", "cookies", "redis", "auth", "secrets"],
      },
      {
        label: "Code Review Standards",
        href: "/devs/01-architecture/code-review-standards",
        keywords: ["audit", "checklist", "line limits", "quality"],
      },
    ],
  },
  {
    id: "02-engine",
    title: "02. Core Dynamic Engine",
    icon: Code,
    items: [
      {
        label: "GMC Payload Spec",
        href: "/devs/02-core-engine/gmc-schema-spec",
        keywords: ["gmc", "schema", "zod", "12-column", "grid"],
      },
      {
        label: "Form Rendering Pipeline",
        href: "/devs/02-core-engine/form-rendering-pipeline",
        keywords: ["useSchema", "DynamicForm", "FieldFactory", "FormRenderer"],
      },
      {
        label: "Component Loader & Pop-outs",
        href: "/devs/02-core-engine/component-loader",
        keywords: ["ComponentLoader", "window", "panel", "pop-out", "override"],
      },
    ],
  },
  {
    id: "03-domain",
    title: "03. Domain Feature Modules",
    icon: Folder,
    items: [
      {
        label: "Auth & Session",
        href: "/devs/03-domain-features/auth-and-session",
        keywords: ["login", "change password", "session", "redis"],
      },
      {
        label: "Workspace & Windows",
        href: "/devs/03-domain-features/workspace-and-windows",
        keywords: ["tab", "draft", "useWorkbenchStore", "screen-launcher"],
      },
      {
        label: "Inquiries Engine",
        href: "/devs/03-domain-features/inquiries",
        keywords: ["INQ", "GIR", "SIR", "table", "react-table"],
      },
      {
        label: "Reporting Studio",
        href: "/devs/03-domain-features/reporting-studio",
        keywords: ["SC.REPORT.LINE", "report", "viewer", "ledger"],
      },
      {
        label: "System Config Tools",
        href: "/devs/03-domain-features/system-config",
        keywords: ["SC.FORM.BUILDER", "SC.MODEL.CONFIG", "SC.MENU.DESIGN"],
      },
    ],
  },
  {
    id: "04-dataflow",
    title: "04. Data Flow & Network APIs",
    icon: Server,
    items: [
      {
        label: "gRPC & BFF Proxy",
        href: "/devs/04-data-flow-and-api/grpc-and-bff-proxy",
        keywords: ["api/proxy", "Envelope", "dispatch", "gRPC"],
      },
      {
        label: "Dynamic API Architecture",
        href: "/devs/04-data-flow-and-api/dynamic-api-integration",
        keywords: ["recordFunction", "APIResponse", "Dynamic API"],
      },
      {
        label: "Caching & Circuit Breaker",
        href: "/devs/04-data-flow-and-api/caching-strategy",
        keywords: ["ioredis", "circuit breaker", "read-through", "cache"],
      },
      {
        label: "Error Handling & Alerts",
        href: "/devs/04-data-flow-and-api/error-handling-and-alerts",
        keywords: ["useAlertStore", "error boundary", "toast", "confirm"],
      },
    ],
  },
  {
    id: "05-runbooks",
    title: "05. Developer Runbooks",
    icon: Terminal,
    items: [
      {
        label: "Quickstart Local Setup",
        href: "/devs/05-developer-guides/quickstart-setup",
        keywords: ["pnpm", "env", "dev", "setup", "local"],
      },
      {
        label: "Scaffold New DDD Feature",
        href: "/devs/05-developer-guides/adding-new-domain-feature",
        keywords: ["scaffold", "feature", "runbook", "domain"],
      },
      {
        label: "Offline Static Mock Mode",
        href: "/devs/05-developer-guides/static-mock-mode",
        keywords: ["MODEL_SOURCE=static", "fixtures", "specs"],
      },
      {
        label: "Extending & Creating Doc Modules",
        href: "/devs/05-developer-guides/extending-doc-portal-or-module",
        keywords: ["docs", "portal", "manual", "scaffold", "navigation"],
      },
      {
        label: "Git Workflow & Commit Rules",
        href: "/devs/05-developer-guides/git-workflow-and-commits",
        keywords: ["git", "commitlint", "husky", "conventional"],
      },
    ],
  },
];
