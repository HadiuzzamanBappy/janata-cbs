/**
 * @fileoverview Container Block Clustering & Layout Navigation
 * @module cbs-form-spec/layout-blocks
 *
 * Core Invariants:
 * - Contiguous/adjacent tab sections sharing a `groupId` are clustered into a unified tab group block.
 * - Single sections (cards and root containers) remain independent and render sequentially.
 * - Pure layout calculation with zero DOM or UI framework dependencies.
 */

import type { FormElement, FormSection } from "@/lib/data-schemas";

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
/**
 * The field spec behind a value key: a top-level `NAME`, or an inner field of an object group
 * (`ADDRESS.city`, or `ITEMS.0.code` for a repeating set; numeric segments are row indexes).
 */
export function findFieldSpecByKey(sections: FormSection[], key: string): FormElement | undefined {
  const fields = sections.flatMap((s) => s.fields ?? []);
  const direct = fields.find((f) => f.NAME === key);
  if (direct) return direct;

  const [head, ...rest] = key.split(".");
  let current = fields.find((f) => f.NAME === head);
  for (const segment of rest) {
    if (!current) return undefined;
    if (/^\d+$/.test(segment)) continue;
    current = (current.PROP ?? []).find((f) => f.NAME === segment);
  }
  return current;
}

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
