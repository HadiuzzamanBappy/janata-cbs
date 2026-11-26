/**
 * @fileoverview Container Block Clustering & Layout Navigation
 * @module cbs-form-spec/layout-blocks
 *
 * Core Invariants:
 * - Tab sections sharing a `groupId` form one tab group block, placed at the group's first tab.
 * - Single sections (cards and root containers) remain independent and render sequentially.
 * - Pure layout calculation with zero DOM or UI framework dependencies.
 */

import type { ContainerConfig, FormSection } from "@/lib/data-schemas";

/**
 * Union type representing an isolated section or an aggregated tab cluster.
 */
export type RenderBlock =
  | { type: "single"; section: FormSection }
  | { type: "tab-group"; groupId: string; tabSections: FormSection[] };

// ─────────────────────────────────────────────────────────────────────────────
// Render Block Clustering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clusters form sections into render blocks. Every tab with the same `groupId` (untitled-group
 * tabs together) joins one tab group, placed where the group's first tab is, even when other
 * sections sit between its tabs; all others remain standalone blocks. `sanitizeFormConfigRecord`
 * stores a group's tabs together, so a saved layout's order is its rendered order.
 *
 * @param sections List of form sections from the compiled specification.
 * @returns Array of clustered RenderBlocks ready for layout orchestration.
 */
export function buildRenderBlocks(sections: FormSection[]): RenderBlock[] {
  const blocks: RenderBlock[] = [];
  const groupBlockMap = new Map<
    string,
    { type: "tab-group"; groupId: string; tabSections: FormSection[] }
  >();

  for (const sec of sections) {
    const isTab = sec.containerType === "tab";

    if (isTab) {
      const grpId = sec.groupId?.trim() || "default_tab_group";
      const existingBlock = groupBlockMap.get(grpId);

      if (existingBlock) {
        existingBlock.tabSections.push(sec);
      } else {
        const newBlock = { type: "tab-group" as const, groupId: grpId, tabSections: [sec] };
        groupBlockMap.set(grpId, newBlock);
        blocks.push(newBlock);
      }
    } else {
      blocks.push({ type: "single", section: sec });
    }
  }

  return blocks;
}

/**
 * The settings that govern a tab group (variant, height, density): those of the first tab that sets
 * a group option (`tabVariant`, `heightMode`, `minHeight`), else those of `fallback`.
 */
export function resolveTabGroupConfig(
  tabSections: FormSection[],
  fallback: FormSection | undefined,
): ContainerConfig {
  const configured = tabSections.find(
    ({ containerConfig: c }) => c?.tabVariant || c?.heightMode || c?.minHeight,
  );
  return configured?.containerConfig ?? fallback?.containerConfig ?? {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Block Gap Navigation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the raw sections array insertion index corresponding to a rendered block gap.
 * Protects clustered tab groups from being unintentionally bisected during section reordering.
 *
 * @param blocks Current array of clustered RenderBlocks.
 * @param sections Flat array of all form sections.
 * @param gapIndex Insertion gap index between blocks.
 * @returns Index in the raw sections array where a new or dragged section should be placed.
 */
export function getBlockGapSectionIndex(
  blocks: RenderBlock[],
  sections: FormSection[],
  gapIndex: number,
): number {
  if (gapIndex <= 0) return 0;
  if (gapIndex >= blocks.length) return sections.length;

  const targetBlock = blocks[gapIndex];
  if (!targetBlock) return sections.length;

  const targetSec =
    targetBlock.type === "single" ? targetBlock.section : targetBlock.tabSections[0];
  if (!targetSec) return sections.length;

  const rawIdx = sections.findIndex((s) => s.id === targetSec.id);
  return rawIdx >= 0 ? rawIdx : sections.length;
}
