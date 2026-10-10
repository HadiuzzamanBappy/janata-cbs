"use server";

import fs from "node:fs";
import path from "node:path";
import { appConfig } from "@/lib/core-config";
import { DEV_NAV_GROUPS, MANUAL_NAV_GROUPS } from "./config";
import type { CompiledDocItem, PortalDocsBundle } from "./types";

/**
 * Server action to fetch and aggregate all markdown docs for a portal.
 * Reads nav config on the server to guarantee 100% serializable arguments.
 */
export async function fetchAllPortalDocsAction(portalSubFolder: string): Promise<PortalDocsBundle> {
  const selectedGroups = portalSubFolder === "manual" ? MANUAL_NAV_GROUPS : DEV_NAV_GROUPS;

  const items: CompiledDocItem[] = [];

  // Also include root README.md if present
  const rootReadmePath = path.join(process.cwd(), "docs", portalSubFolder, "README.md");
  if (fs.existsSync(rootReadmePath)) {
    items.push({
      sectionId: "00-overview",
      sectionTitle: "Overview",
      itemTitle: "Portal Overview & Sitemap",
      href: `/${portalSubFolder}`,
      content: fs.readFileSync(rootReadmePath, "utf-8"),
    });
  }

  for (const group of selectedGroups) {
    for (const item of group.items) {
      const pathSuffix = item.href.replace(new RegExp(`^/${portalSubFolder}/?`), "");
      const relativePath = pathSuffix.endsWith(".md") ? pathSuffix : `${pathSuffix}.md`;
      const filePath = path.join(process.cwd(), "docs", portalSubFolder, relativePath);

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        items.push({
          sectionId: group.id,
          sectionTitle: group.title,
          itemTitle: item.label,
          href: item.href,
          content,
        });
      }
    }
  }

  const portalTitle =
    portalSubFolder === "devs"
      ? "CBS Core Banking Workbench - Developer Documentation Hub"
      : "CBS Core Banking Workbench - Officer Operating Manual";

  return {
    portalTitle,
    generatedAt: new Date().toLocaleString(appConfig.format.dateLocale, {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    items,
  };
}
