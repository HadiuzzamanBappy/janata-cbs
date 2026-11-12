import type { FormSection } from "@/lib/data-schemas/form-config-schema";

export type RenderBlock =
  | { type: "single"; section: FormSection }
  | { type: "tab-group"; groupId: string; tabSections: FormSection[] };

/**
 * Clusters sections into render-blocks preserving designer order.
 * - Contiguous/adjacent tab sections sharing a groupId are clustered into an inline tab group.
 * - Single sections (card or root fields) are rendered sequentially in their exact position.
 * - This allows full independence: raw fields, cards, and tab groups can be placed and
 *   interleaved at any position in any order.
 */
export function buildRenderBlocks(sections: FormSection[]): RenderBlock[] {
  const blocks: RenderBlock[] = [];

  for (const sec of sections) {
    const isTab = sec.containerType === "tab";

    if (isTab) {
      const grpId = sec.groupId?.trim() || "default_tab_group";
      const lastBlock = blocks[blocks.length - 1];

      // If the preceding block is already this tab group, add to it
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

/**
 * Resolves the raw sections array insertion index corresponding to a block gap.
 * Protects clustered tab groups from being unintentionally split.
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
