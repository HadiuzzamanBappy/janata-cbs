import type { FormSection } from "@/lib/data-schemas/form-config-schema";

export type RenderBlock =
  | { type: "single"; section: FormSection }
  | { type: "tab-group"; groupId: string; tabSections: FormSection[] };

/**
 * Clusters sections into render-blocks preserving insertion order.
 */
export function buildRenderBlocks(sections: FormSection[]): RenderBlock[] {
  const blocks: RenderBlock[] = [];
  const seenTabGroups = new Map<string, FormSection[]>();

  for (const sec of sections) {
    if (sec.zone === "tab") {
      const grpId = sec.tabGroupId?.trim() || "default_tab_group";
      if (!seenTabGroups.has(grpId)) {
        const grpList: FormSection[] = [sec];
        seenTabGroups.set(grpId, grpList);
        blocks.push({ type: "tab-group", groupId: grpId, tabSections: grpList });
      } else {
        seenTabGroups.get(grpId)?.push(sec);
      }
    } else {
      blocks.push({ type: "single", section: sec });
    }
  }

  return blocks;
}
