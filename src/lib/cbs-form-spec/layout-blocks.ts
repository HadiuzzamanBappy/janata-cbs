/**
 * @fileoverview Container Block Clustering & Layout Navigation
 * @module cbs-form-spec/layout-blocks
 *
 * Core Invariants:
 * - Contiguous/adjacent tab sections sharing a `groupId` are clustered into a unified tab group block.
 * - Single sections (cards and root containers) remain independent and render sequentially.
 * - Pure layout calculation with zero DOM or UI framework dependencies.
 */

import type { FormSection } from "@/lib/data-schemas/form-config-schema";

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
 * Clusters form sections into render blocks while preserving visual designer sequence.
 * Contiguous tabs with matching `groupId` form tab groups; all others remain standalone blocks.
 *
 * @param sections List of form sections from the compiled specification.
 * @returns Array of clustered RenderBlocks ready for layout orchestration.
 */
export function buildRenderBlocks(sections: FormSection[]): RenderBlock[] {
  const blocks: RenderBlock[] = [];

  for (const sec of sections) {
    const isTab = sec.containerType === "tab";

    if (isTab) {
      const grpId = sec.groupId?.trim() || "default_tab_group";
      const lastBlock = blocks[blocks.length - 1];

      if (lastBlock && lastBlock.type === "tab-group" && lastBlock.groupId === grpId) {
        lastBlock.tabSections.push(sec);
      } else {
        blocks.push({ type: "tab-group", groupId: grpId, tabSections: [sec] });
      }
    } else {
      blocks.push({ type: "single", section: sec });
    }
  }

  return blocks;
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
