import { Shield } from "lucide-react";
import type { NavGroup } from "./types";

/**
 * Developer portal navigation. Every `href` must resolve to an existing
 * `docs/devs/<path>.md` file (see `readDocFile`); add an entry only when its page exists.
 */
export const DEV_NAV_GROUPS: NavGroup[] = [
  {
    id: "01-engineering",
    title: "01. Engineering Reference",
    icon: Shield,
    items: [
      {
        label: "Project Tree",
        href: "/devs/PROJECT_TREE",
        keywords: ["tree", "folder", "structure", "layers", "modules"],
      },
      {
        label: "Architecture Audit Checklist",
        href: "/devs/ARCHITECTURE_AUDIT_CHECKLIST",
        keywords: ["audit", "checklist", "security", "modularity", "centralization", "four-eyes"],
      },
      {
        label: "Project Roadmap",
        href: "/devs/PROJECT_ROADMAP",
        keywords: ["roadmap", "onboarding", "walkthrough", "learning", "levels", "request path"],
      },
    ],
  },
];

/**
 * Officer manual navigation. Every `href` must resolve to an existing
 * `docs/manual/<path>.md` file. No manual pages beyond the portal README exist yet.
 */
export const MANUAL_NAV_GROUPS: NavGroup[] = [];
