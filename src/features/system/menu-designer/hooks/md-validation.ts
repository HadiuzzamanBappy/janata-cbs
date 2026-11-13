"use client";

import type { z } from "zod";
import { mapZodIssuesToTabs } from "@/lib/cbs-screen";
import type {
  MenuDesignerValidationError,
  MenuItem,
} from "@/lib/data-schemas/menu-designer-schema";

export const MAX_MENU_TREE_DEPTH = 4;

export function mapMdZodIssues(issues: z.ZodIssue[]): MenuDesignerValidationError[] {
  return mapZodIssuesToTabs<"general" | "canvas">(issues, (path) => {
    const head = path[0];
    if (head === "menuTree") return "canvas";
    return "general";
  });
}

/**
 * Validates deep CBS domain rules on navigation tree before saving:
 * 1. Maximum nesting depth constraint (depth <= 4)
 * 2. Empty group folder detection (folders must have at least 1 child)
 * 3. Command uniqueness constraint (no duplicate action routes across branches)
 */
export function validateMenuTreeDomain(tree: MenuItem[]): MenuDesignerValidationError[] {
  const errors: MenuDesignerValidationError[] = [];
  const seenCommands = new Map<string, string>();

  function traverse(nodes: MenuItem[], depth: number) {
    if (depth > MAX_MENU_TREE_DEPTH) {
      for (const node of nodes) {
        errors.push({
          id: `depth_${node.id}`,
          tab: "canvas",
          nodeId: node.id,
          fieldKey: "depth",
          message: `Item "${node.label}" exceeds maximum navigation depth of ${MAX_MENU_TREE_DEPTH} levels.`,
        });
      }
    }

    for (const node of nodes) {
      const isFolder = !node.command || node.menuType === "GROUP";

      if (isFolder && (!node.children || node.children.length === 0)) {
        errors.push({
          id: `empty_folder_${node.id}`,
          tab: "canvas",
          nodeId: node.id,
          fieldKey: "children",
          message: `Folder group "${node.label}" is empty. Add child items or remove the folder.`,
        });
      }

      if (!isFolder && node.command?.trim()) {
        const cleanCmd = node.command.trim().toUpperCase();
        const existingLabel = seenCommands.get(cleanCmd);
        if (existingLabel) {
          errors.push({
            id: `dup_cmd_${node.id}`,
            tab: "canvas",
            nodeId: node.id,
            fieldKey: "command",
            message: `Duplicate command "${cleanCmd}" used in "${node.label}". Already mapped in "${existingLabel}".`,
          });
        } else {
          seenCommands.set(cleanCmd, node.label);
        }
      }

      if (node.children && node.children.length > 0) {
        traverse(node.children, depth + 1);
      }
    }
  }

  traverse(tree, 1);
  return errors;
}
