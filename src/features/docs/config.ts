import { FolderKanban, Shield } from "lucide-react";
import type { NavGroup } from "./types";

/**
 * Developer portal navigation. Every `href` must resolve to an existing
 * `docs/devs/<path>.md` file (see `readDocFile`); add an entry only when its page exists.
 */
export const DEV_NAV_GROUPS: NavGroup[] = [
  {
    id: "00-refractor",
    title: "00. Refactoring",
    icon: FolderKanban,
    items: [
      {
        label: "Master Refactoring Audit Plan",
        href: "/devs/00-refractor/refractor",
        keywords: ["refactor", "audit", "plan", "phases", "dry", "dead code", "red flags"],
      },
    ],
  },
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
        label: "Library Checklist",
        href: "/devs/LIB_CHECKLIST",
        keywords: ["lib", "checklist", "headless", "layers", "determinism", "size budget"],
      },
      {
        label: "Developer Study Plan",
        href: "/devs/PROJECT_STUDY_PLAN",
        keywords: ["study", "onboarding", "curriculum", "intern", "learning"],
      },
    ],
  },
];

/**
 * Officer manual navigation. Every `href` must resolve to an existing
 * `docs/manual/<path>.md` file. No manual pages beyond the portal README exist yet.
 */
export const MANUAL_NAV_GROUPS: NavGroup[] = [];
